---
title: Fedex物流单号状态爬取
category:
    - 爬虫
    - fedex
    - python
---

## 项目地址
[[Github]Fedex Tracking Bot](https://github.com/Jayczee/fedex_tracking_bot)

## 背景
在最近的工作中，运营部门要求确认一些 FedEx 物流单号的状态。虽然自己在过去的工作中主要专注于 CRUD 操作，并没有深入了解物流相关的内容，但这次的任务激发了对这一领域的浓厚兴趣。为了满足需求，经过一番摸索和实践，成功实现了一个简单的爬虫，收获颇丰，感到非常兴奋，也希望能与大家分享经验并寻求指导。

## 需求
本次任务的目标是对 **8000** 个左右的 FedEx 物流单号进行状态爬取，明确判断其状态是 **Label Created** 还是 **Delivered**。这一过程涉及到对 FedEx 物流系统的深入了解，尤其是在状态查询的实现上。

## 尝试方案记录

### 1. 使用官方 API
- **结果**：失败
- **原因**：由于自己负责的项目并未对接过 FedEx，因此需要现学，容易在过程中遇到各种问题。不过，可以参考公司其他项目的配置作为备选方案。

### 2. 直接调用 FedEx 查询接口
- **结果**：失败
- **原因**：尝试直接调用 `https://api.fedex.com.cn/track/v2/shipments` 接口，发现返回了 403 错误。即便添加了 Cookie 和 User-Agent 等必要参数，依然无法成功获取数据。

### 3. Jsoup 获取页面信息
- **结果**：失败
- **原因**：通过分析发现，物流查询页面为动态加载的页面，使用 Jsoup 获取的 HTML 仅为初始页面，无法获得实际的物流信息。

### 4. 使用 Selenium
- **结果**：成功
- **原因**：考虑到页面是动态加载的，决定使用 Selenium 库。Selenium 能够模拟真实用户在浏览器中的操作，访问页面并等待 JavaScript 渲染数据。虽然原本计划使用 Java 实现，但由于网上大部分文档和案例都是用 Python 编写，因此最终选择 Python ���完成代码编写，便于快速实施。

## 物流状态信息分析
通过对页面的深入分析，发现物流状态相关的 HTML 结构是有规律可循的：

- **加粗黑体字部分**（如“寄件人”、“我们收到了您的包裹”、“外出递送”、“已送达”）使用 `class="shipment-status-progress-step-label"` 的 `<span>` 标签进行展示。
- **斜体小字部分**（如“标签已创建”、“已送达”）则使用 `class="shipment-status-progress-step-label-info"` 的 `<span>` 标签。

![Fedex物流信息截图](https://blog-1302595532.cos.ap-shanghai.myqcloud.com/blog/fedex-tracking-bot-1.png)

### 基本逻辑
基于以上分析，爬取物流状态的基本逻辑如下：
1. 使用 Selenium 访问指定的 URL，并将单号部分替换为待查询的单号。
2. 等待页面加载完成，确保上述 class 的元素出现在 HTML 中。
3. 定位到 `shipment-status-progress-step active` 下的状态信息，并获取其值。

## 遇到的问题及解决方案

### 1. 页面提示 “Under Construction”
::: warning
在某些情况下，FedEx 页面会提示“Under Construction”，导致无法获取信息。为了解决这一问题，建议在代码中加入重试机制，以便在遇到此类问题时能够自动重试。
:::

### 2. 爬取速度慢
::: tip
由于每个单号的查询需要大约 10 秒钟，整体爬取速度较慢。为此，可以考虑使用多线程技术，开启多个窗口同时进行爬取。不过需要注意的是，多开 Chrome 浏览器会消耗大量内存，建议合理设置线程数量。
:::

### 3. 内存泄漏
在初次实现时，爬取到的数据会暂存到内存中，等爬取完成后再一次性写入 Excel 文件。结果在爬取到 1000 个单号时，内存占用过高导致电脑崩溃。经过反复测试，最终决定将数据在爬取过程中直接写入文件，并加锁以避免并发问题。

### 4. 访问频率过高被屏蔽
::: tip
在进行大量查询时，频繁访问会导致被 FedEx 屏蔽。为了解决这个问题，可以使用代理池，通过实际测试发现，当查询次数超过 100 次时，便会被暂时禁止访问。可以考虑使用自己的代理节点，借助工具将其转为代理池，以均匀分配访问请求。
:::


## 结论
通过此次实践，成功实现了对 FedEx 物流单号状态的爬取，积累了宝贵的经验和教训。尽管在过程中遇到了一些挑战，但最终都一一克服。希望能与各位前辈分享经验，欢迎进行指导和讨论。


## 参考资源
- [Glider Guide](https://github.com/Rain-kl/glider_guid) - 该工具可以将自己的代理节点转为代理池，帮助更好地管理请求。

## 效果图

![爬取结果](https://blog-1302595532.cos.ap-shanghai.myqcloud.com/blog/fedex-tracking-bot-2.png)

## 最终代码

```python
import pandas as pd
from bs4 import BeautifulSoup
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
import time
import concurrent.futures
import logging
from datetime import datetime
import threading
import os

# 设置日志配置
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger()

# 读取 input.xlsx 中的所有数据
df = pd.read_excel('input.xlsx')

# 获取已爬取的单号
processed_numbers = set()
for file in os.listdir('.'):
    if file.startswith('tracking_results') and file.endswith('.xlsx'):
        logger.info(f"文件名：{file.split('.')[0]}")
        processed_df = pd.read_excel(file)
        existed_list = processed_df['tracking'].tolist()
        logger.info(f"存在已爬取单号{len(existed_list)}个")
        logger.info(f"添加前已存在{len(processed_numbers)}个")
        processed_numbers.update(existed_list)
        logger.info(f"添加后已存在{len(processed_numbers)}个")

# 将未爬取的 ref_number 列的数据存入 list_ 中
list_ = [num for num in df['ref_number'].tolist() if num not in processed_numbers]
total_count = len(list_)  # 总数量
logger.info(f"需要爬取的总数量: {total_count}")

# 设置 ChromeOptions
chrome_options = Options()
chrome_options.add_argument('--proxy-server=socks5://127.0.0.1:8443')
chrome_options.add_argument('--disable-gpu')  # 禁用 GPU 加速
chrome_options.add_argument('--no-sandbox')  # 解决 DevToolsActivePort 文件不存在的错误
chrome_options.add_argument('--disable-dev-shm-usage')  # 共享内存不足的问题

# 创建锁
lock = threading.Lock()

# 找到下一个 tracking_resultsN.xlsx 文件名
file_index = 1
while os.path.exists(f'tracking_results{file_index}.xlsx'):
    file_index += 1
output_file = f'tracking_results{file_index}.xlsx'

# 定义一个函数来处理每个单号
def fetch_tracking_info(num):
    driver = None
    retries = 3  # 设置重试次数
    for attempt in range(retries):
        try:
            logger.info(f"开始处理单号: {num}, 尝试次数: {attempt + 1}")
            driver = webdriver.Chrome(service=Service('./chromedriver.exe'), options=chrome_options)
            driver.execute_cdp_cmd("Page.addScriptToEvaluateOnNewDocument", {
                "source": """
                Object.defineProperty(navigator, 'webdriver', {
                  get: () => undefined
                })
              """
            })

            driver.get(f"https://www.fedex.com.cn/fedextrack/?trknbr={num}")

            # 等待 shipment-status-progress-step-label 出现并且有值
            try:
                WebDriverWait(driver, 15).until(
                    EC.presence_of_element_located((By.CLASS_NAME, 'shipment-status-progress-step-label-info'))
                )
                time.sleep(2)  # 确保页面加载完成
                x = driver.page_source
                html = BeautifulSoup(x, "html.parser")
                active_step = html.find('div', class_='shipment-status-progress-step active')

                label_value = None
                if active_step:
                    label_span = active_step.find('span', class_='shipment-status-progress-step-label-info')
                    if label_span and label_span.get_text(strip=True):
                        label_value = label_span.get_text(strip=True)

                if label_value:
                    logger.info(f"完成处理单号: {num}, 状态: {label_value}")
                    # 使用锁来确保线程安全写入Excel文件
                    with lock:
                        if os.path.exists(output_file):
                            existing_df = pd.read_excel(output_file)
                            new_df = pd.DataFrame([[num, label_value]], columns=['tracking', 'label_value'], dtype=str)
                            result_df = pd.concat([existing_df, new_df], ignore_index=True)
                        else:
                            result_df = pd.DataFrame([[num, label_value]], columns=['tracking', 'label_value'], dtype=str)
                        result_df.to_excel(output_file, index=False)
                    return num, label_value
                else:
                    raise Exception("状态标签没有值")
            except Exception as e:
                logger.warning(f"单号 {num} 状态标签未找到或无值")
                if attempt < retries - 1:
                    logger.info(f"重试单号: {num}, 尝试次数: {attempt + 2}")
                else:
                    logger.error(f"单号 {num} 处理失败，已达到最大重试次数")
                continue  # 继续重试
        except Exception as e:
            logger.error(f"处理单号 {num} 时发生错误: {e}")
        finally:
            if driver:
                driver.quit()

    # 在达到最大重试次数后，记录失败的结果
    with lock:
        if os.path.exists(output_file):
            existing_df = pd.read_excel(output_file)   
            new_df = pd.DataFrame([[num, 'Unknown']], columns=['tracking', 'label_value'], dtype=str)
            result_df = pd.concat([existing_df, new_df], ignore_index=True)
        else:
            result_df = pd.DataFrame([[num, 'Unknown']], columns=['tracking', 'label_value'], dtype=str)
        result_df.to_excel(output_file, index=False)
    return num, None

# 记录开始时间
start_time = datetime.now()

# 使用 ThreadPoolExecutor 来并行处理
with concurrent.futures.ThreadPoolExecutor(max_workers=15) as executor:
    future_to_num = {executor.submit(fetch_tracking_info, num): num for num in list_}
    for future in concurrent.futures.as_completed(future_to_num):
        tracking_num, label_value = future.result()

# 记录结束时间
end_time = datetime.now()
# 计算运行时长
duration = end_time - start_time

# 输出运行时长
hours, remainder = divmod(duration.total_seconds(), 3600)
minutes, seconds = divmod(remainder, 60)
logger.info(f"程序运行时间: {int(hours)}时 {int(minutes)}分 {int(seconds)}秒")

logger.info("所有单号处理完成")
```