---
title: 📦 Fedex面单PDF中读取物流单号
isOriginal: true
star: true
category:
    - Code
tag:
    - java
    - fedex
---

## 背景

在项目中，客户在操作出库时需要上传或购买面单。当通过自家系统购买时，API会向Fedex、UPS等物流服务商请求面单，返回的单号将与订单绑定，便于后续管理。然而，当客户从其他地方购买面单并下载为图片格式的PDF时，无法直接获取单号。

## 思路

面单上包含条码信息，通过扫描条码可获取单号、地址等相关信息。

## 问题点

1. **条码干扰信息**  
   面单上可能包含多个条码，直接扫描时获取的字符串会包含大量干扰信息。  
   **解决方案：** 在扫描条码前，根据条码位置截取面单条码所在区域，并放大图片，以提高扫描结果的准确性。

2. **条码位置不一致**  
   不同服务的面单条码位置各异。  
   **解决方案：** 需针对不同面单条码位置进行判断，逐一排除。Fedex面单相对稳定，条码通常位于面单底部，识别率接近100%。而UPS的不同服务条码位置差异较大，需要进行更多判断。

## 代码实现

以下是读取Fedex面单PDF中物流单号的Java代码示例：

```java
public static List<String> readTrackingNumbers(File pdfFile) {
    final List<String> res = new ArrayList<>();
    try (final PDDocument document = PDDocument.load(pdfFile)) {
        final PDFRenderer renderer = new PDFRenderer(document);
        for (int pageIndex = 0; pageIndex < document.getNumberOfPages(); pageIndex++) {
            if (document.getPage(pageIndex).getMediaBox().getWidth() > document.getPage(0).getMediaBox().getHeight()) {
                document.getPage(pageIndex).setRotation(90);
            }
            BufferedImage image = renderer.renderImageWithDPI(pageIndex, 300);
            int width;
            int height;
            BinaryBitmap bitmap = new BinaryBitmap(new HybridBinarizer(new BufferedImageLuminanceSource(image)));

            Result result = new MultiFormatReader().decode(bitmap);
            String resultText = result.getText();
            width = image.getWidth();
            height = image.getHeight();

            if (resultText.length() > 60 || resultText.startsWith("9621")) {
                // Fedex面单：扫描结果包含冗余信息，若以9621开头则为Fedex SmartPost，需扫描下面的条码
                image = image.getSubimage(0, (int) (height * 0.6), width, (int) (height * 0.4));
                bitmap = new BinaryBitmap(new HybridBinarizer(new BufferedImageLuminanceSource(image)));
            } else if (resultText.length() < 10) {
                // UPS Ground面单：面单快递条码之前还有一个短条码
                image = image.getSubimage(0, (int) (height * 0.6), width, (int) (height * 0.4));
                bitmap = new BinaryBitmap(new HybridBinarizer(new BufferedImageLuminanceSource(image)));
            }

            result = new MultiFormatReader().decode(bitmap);
            resultText = result.getText();
            res.add(resultText.toUpperCase());
        }
    } catch (IOException | NotFoundException e) {
        e.printStackTrace();
    }
    return res;
}
```