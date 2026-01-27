---
title: Win下彻底清理Sangfor深信服相关文件
isOriginal: true
category:
    - Windows
tag:
    - sangfor
---

大概一年多前对象需要用我的电脑完成工作相关的一些事情，需要安装深信服的一些软件来远程操控公司电脑。事后我卸载了相关软件，运行的是软件自带的uninstall程序。

但是最近查看任务管理器的进程列表，竟然还是看到了Sangfor开头的进程，甚是无语。

## 删除服务

想到每次开机都会自启动，第一想法就是系统服务项中会不会有，打开Windows的服务管理(services.msc)，按名称排列寻找S开头的服务，好家伙，第一个就是`Sangfor VPN Security Protect Service`，关闭此服务后我尝试设置禁用，竟然还拒绝访问！随即尝试以下步骤：

### 管理员运行services.msc

Win + R输入services.msc，Ctrl + Shift + Enter管理员运行，无效，仍然拒绝访问。

### 改注册表

从服务列表中可以看到这个服务真实名称是`SangforPWEx`

找到注册表路径`HKEY_LOCAL_MACHINE\SYSTEM\CurrentControlSet\Services\SangforPWEx`，修改其start值为4（即DISABLED），修改失败，管理员模式下也无效。

### sc delete命令

直接管理员cmd运行`sc delete SangforPWEx`，删除成功

## 删除驱动

cmd运行`driverquery | findstr /i sangfor`，找到以下输出，说明还有残留驱动：

```bash
SangforVnic  Sangfor SSL VPN CS Sup Kernel        2012/11/20 20:31:43
```

### sc delete命令

如法炮制，sc delete一条命令直接删除了

## 其他残留

### 注册表

注册表全局搜索sangfor，找到`计算机\HKEY_CLASSES_ROOT\AppID\某个APPID`下的LocalService的值为前面删除的`SangforPWEx`

通过询问gpt得知，这仅是一个绑定关系，表示某个COM组件启动时需要用到`SangforPWEx`服务，通过`sc query SangforPWEx`寻找相关的依赖，得到以下输出：

```bash
[SC] EnumQueryServicesStatus:OpenService 失败 1060:
```

眼睛里容不得沙子，直接删除注册表该APPID整个目录。

上面因为已经删掉了相关服务，这些注册项已经属于无用注册项了，可以找一些注册表清理软件删除这些无用注册项，或者使用以下脚本专门删除Sangfor相关注册项（保存为xxx.ps1然后用pwsh运行）。

```bash
<#
.SYNOPSIS
  Find & remove Sangfor leftovers (COM/AppID/TypeLib/etc.) with backup.
  Default: dry-run. Use -Force to actually delete.

.USAGE
  # Dry-run (recommended first):
  powershell -ExecutionPolicy Bypass -File .\Remove-Sangfor-Leftovers.ps1

  # Do it for real:
  powershell -ExecutionPolicy Bypass -File .\Remove-Sangfor-Leftovers.ps1 -Force

  # Change backup folder:
  powershell -ExecutionPolicy Bypass -File .\Remove-Sangfor-Leftovers.ps1 -Force -BackupDir "D:\reg_backup"
#>

param(
  [switch]$Force,
  [string]$BackupDir = "$env:SystemDrive\Sangfor_Removal_Backup"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Test-Admin {
  $id = [Security.Principal.WindowsIdentity]::GetCurrent()
  $p  = New-Object Security.Principal.WindowsPrincipal($id)
  return $p.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

function Ensure-Dir([string]$Path) {
  if (-not (Test-Path -LiteralPath $Path)) {
    New-Item -ItemType Directory -Path $Path | Out-Null
  }
}

function Write-Plan([string]$msg) {
  if ($Force) { Write-Host "[DO]  $msg" -ForegroundColor Yellow }
  else        { Write-Host "[PLAN] $msg" -ForegroundColor Cyan }
}

function Write-Ok([string]$msg) {
  Write-Host "[OK]  $msg" -ForegroundColor Green
}

function Write-Warn([string]$msg) {
  Write-Host "[WARN] $msg" -ForegroundColor DarkYellow
}

function Backup-RegKey([string]$RegPath, [string]$NameHint) {
  Ensure-Dir $BackupDir
  $ts = (Get-Date).ToString("yyyyMMdd_HHmmss")
  $safe = ($NameHint -replace '[^a-zA-Z0-9_\-\.]', '_')
  $out = Join-Path $BackupDir "$ts`_$safe.reg"

  # reg.exe expects root like HKLM\...
  $cmd = "reg.exe export `"$RegPath`" `"$out`" /y"
  Write-Plan "Backup registry key: $RegPath -> $out"
  if ($Force) {
    cmd.exe /c $cmd | Out-Null
    Write-Ok "Backed up: $out"
  }
}

function Remove-RegKey([string]$PsPath, [string]$RegExportPath, [string]$NameHint) {
  if (-not (Test-Path -LiteralPath $PsPath)) {
    Write-Warn "Not found: $PsPath"
    return
  }
  Backup-RegKey -RegPath $RegExportPath -NameHint $NameHint
  Write-Plan "Remove registry key: $PsPath"
  if ($Force) {
    Remove-Item -LiteralPath $PsPath -Recurse -Force
    Write-Ok "Removed: $PsPath"
  }
}

function Remove-ServiceIfExists([string]$ServiceName) {
  # sc query returns 1060 if not installed
  $out = & sc.exe query $ServiceName 2>&1 | Out-String
  if ($out -match "1060" -or $out -match "does not exist" -or $out -match "未安装") {
    Write-Ok "Service not installed (already gone): $ServiceName"
    return
  }

  Write-Warn "Service still exists: $ServiceName"
  Write-Plan "Try stop service: $ServiceName"
  if ($Force) { & sc.exe stop $ServiceName | Out-Null }

  Write-Plan "Delete service: $ServiceName"
  if ($Force) { & sc.exe delete $ServiceName | Out-Null }

  Write-Ok "Requested deletion: $ServiceName"
}

function Find-And-Remove-OrphanAppIdLocalService([string]$LocalServiceName) {
  # Search HKLM & HKCU (real stores). HKCR is merged view.
  $roots = @(
    @{ Ps="Registry::HKEY_LOCAL_MACHINE\SOFTWARE\Classes\AppID"; Export="HKLM\SOFTWARE\Classes\AppID"; Name="HKLM_AppID" },
    @{ Ps="Registry::HKEY_CURRENT_USER\SOFTWARE\Classes\AppID";  Export="HKCU\SOFTWARE\Classes\AppID"; Name="HKCU_AppID" }
  )

  foreach ($r in $roots) {
    $rootPs = $r.Ps
    if (-not (Test-Path -LiteralPath $rootPs)) { continue }

    Write-Plan "Scan AppID for LocalService='$LocalServiceName' under $rootPs"
    $hits = Get-ChildItem -LiteralPath $rootPs -ErrorAction SilentlyContinue | ForEach-Object {
      $k = $_.PSPath
      try {
        $p = Get-ItemProperty -LiteralPath $k -ErrorAction Stop
        if ($p.PSObject.Properties.Name -contains "LocalService" -and $p.LocalService -eq $LocalServiceName) {
          [PSCustomObject]@{ PsPath=$k; Guid=$_.PSChildName; Root=$r }
        }
      } catch { }
    } | Where-Object { $_ }

    foreach ($h in $hits) {
      $guid = $h.Guid
      $ps   = $h.PsPath
      $exportKey = "$($h.Root.Export)\$guid"
      $hint = "AppID_$guid`_$LocalServiceName"
      Write-Warn "Found AppID LocalService mapping: $ps (LocalService=$LocalServiceName)"
      Remove-RegKey -PsPath $ps -RegExportPath $exportKey -NameHint $hint
    }
  }
}

function Find-And-Remove-TypeLibByName([string]$TypeLibDisplayName) {
  $roots = @(
    @{ Ps="Registry::HKEY_LOCAL_MACHINE\SOFTWARE\Classes\TypeLib"; Export="HKLM\SOFTWARE\Classes\TypeLib"; Name="HKLM_TypeLib" },
    @{ Ps="Registry::HKEY_CURRENT_USER\SOFTWARE\Classes\TypeLib";  Export="HKCU\SOFTWARE\Classes\TypeLib"; Name="HKCU_TypeLib" }
  )

  foreach ($r in $roots) {
    $rootPs = $r.Ps
    if (-not (Test-Path -LiteralPath $rootPs)) { continue }

    Write-Plan "Scan TypeLib for name contains '$TypeLibDisplayName' under $rootPs"
    $guidKeys = Get-ChildItem -LiteralPath $rootPs -ErrorAction SilentlyContinue
    foreach ($g in $guidKeys) {
      # We look under each GUID for versions and check default value(s)
      $gpath = $g.PSPath
      $matched = $false
      try {
        $verKeys = Get-ChildItem -LiteralPath $gpath -ErrorAction SilentlyContinue
        foreach ($v in $verKeys) {
          try {
            $p = Get-ItemProperty -LiteralPath $v.PSPath -ErrorAction Stop
            # default value in PowerShell registry provider is "(default)" as "(default)"? Actually it's stored as property "(default)" not directly.
            # We'll use Get-Item and read .GetValue("") for default.
            $rk = Get-Item -LiteralPath $v.PSPath -ErrorAction Stop
            $def = $rk.GetValue("")
            if ($def -and ($def -like "*$TypeLibDisplayName*")) { $matched = $true; break }
          } catch { }
        }
      } catch { }

      if ($matched) {
        $guid = $g.PSChildName
        Write-Warn "Found TypeLib GUID likely Sangfor-related: $guid (matched '$TypeLibDisplayName')"
        $exportKey = "$($r.Export)\$guid"
        $hint = "TypeLib_$guid"
        Remove-RegKey -PsPath $gpath -RegExportPath $exportKey -NameHint $hint
      }
    }
  }
}

function Find-StringsInCOMRoots([string[]]$Needles) {
  # Optional report-only: search some common COM roots for Sangfor strings
  $targets = @(
    "Registry::HKEY_LOCAL_MACHINE\SOFTWARE\Classes\CLSID",
    "Registry::HKEY_LOCAL_MACHINE\SOFTWARE\Classes\AppID",
    "Registry::HKEY_LOCAL_MACHINE\SOFTWARE\Classes\TypeLib",
    "Registry::HKEY_CURRENT_USER\SOFTWARE\Classes\CLSID",
    "Registry::HKEY_CURRENT_USER\SOFTWARE\Classes\AppID",
    "Registry::HKEY_CURRENT_USER\SOFTWARE\Classes\TypeLib"
  )

  Write-Host ""
  Write-Host "===== REPORT: COM-related keys containing needles =====" -ForegroundColor Magenta
  foreach ($t in $targets) {
    if (-not (Test-Path -LiteralPath $t)) { continue }
    foreach ($n in $Needles) {
      Write-Plan "Search under $t for '$n' (report only)"
      # avoid huge recursion blowing up: limit to 2-level scan quickly
      try {
        Get-ChildItem -LiteralPath $t -ErrorAction SilentlyContinue | ForEach-Object {
          $k1 = $_.PSPath
          # check values on this key
          try {
            $item = Get-Item -LiteralPath $k1 -ErrorAction Stop
            foreach ($vn in $item.GetValueNames()) {
              $vv = $item.GetValue($vn)
              if ($vv -is [string] -and $vv -match [regex]::Escape($n)) {
                Write-Host "[HIT] $k1  value '$vn' contains '$n'" -ForegroundColor DarkCyan
              }
            }
          } catch {}

          # one more level down
          try {
            Get-ChildItem -LiteralPath $k1 -ErrorAction SilentlyContinue | ForEach-Object {
              $k2 = $_.PSPath
              try {
                $item2 = Get-Item -LiteralPath $k2 -ErrorAction Stop
                foreach ($vn2 in $item2.GetValueNames()) {
                  $vv2 = $item2.GetValue($vn2)
                  if ($vv2 -is [string] -and $vv2 -match [regex]::Escape($n)) {
                    Write-Host "[HIT] $k2  value '$vn2' contains '$n'" -ForegroundColor DarkCyan
                  }
                }
              } catch {}
            }
          } catch {}
        }
      } catch {}
    }
  }
  Write-Host "===== END REPORT =====" -ForegroundColor Magenta
}

# ------------------ MAIN ------------------
if (-not (Test-Admin)) {
  throw "Please run PowerShell as Administrator."
}

Write-Host "Sangfor leftover cleanup script" -ForegroundColor White
Write-Host ("Mode: " + ($(if ($Force) { "FORCE (will delete)" } else { "DRY-RUN (no deletion)" }))) -ForegroundColor White
Write-Host ("BackupDir: " + $BackupDir) -ForegroundColor White
Write-Host ""

# 0) Ensure SangforPWEx service really gone (your case: 1060)
Remove-ServiceIfExists -ServiceName "SangforPWEx"

# 1) Remove orphan AppID mappings LocalService=SangforPWEx
Find-And-Remove-OrphanAppIdLocalService -LocalServiceName "SangforPWEx"

# 2) Remove TypeLib entries that display as SangforPWLib (including your GUID)
Find-And-Remove-TypeLibByName -TypeLibDisplayName "SangforPWLib"

# 3) Optional report for any other Sangfor strings in COM roots (no deletion)
Find-StringsInCOMRoots -Needles @("Sangfor", "PWEx", "SangforPWLib", "SangforVnic")

Write-Host ""
Write-Ok "Finished. If you ran in DRY-RUN, rerun with -Force to apply removals."
Write-Host "Backups (if any) are stored in: $BackupDir" -ForegroundColor Gray

```

### 本地文件

全局搜索Sangfor，在sysWoW64下找到了一些dll，通过以下命令搜索文件相关性，发现都是一些不紧要的进程需要用到这些DLL，就直接删除了。

```pwsh
Get-Process | ForEach-Object {
  try {
    $_.Modules | Where-Object { $_.FileName -match "Sangfor" }
  } catch {}
}
```

剩余还有一些driverstore文件，这些简单来说是当前会话的驱动加载记录，可以不管，如果以一定要删除，可以通过pnputil命令删除，先通过以下命令找到正确的driver名称：

```pwsh
pnputil /enum-drivers | findstr /i sangfor
```

得到以下输出:

```pwsh
注册名称(Published Name)： XXX
原始名称:      sangforvnic.inf
提供程序名称:      Sangfor.inc
签名者姓名:        Sangfor Technologies Co.,Ltd
```

根据注册名称运行一下命令：

```pwsh
pnputil /delete-driver 注册名称 /uninstall /force
```

由于我的系统中上述驱动没有注册了，所以没有注册名称，无法也不需要通过pnputil删除，直接不管。