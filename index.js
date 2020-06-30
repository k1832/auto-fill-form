const fs = require('fs');
const puppeteer = require("puppeteer");
const { exit } = require('process');
const URL = "https://docs.google.com/forms/d/e/1FAIpQLSds40IfsLk-XLGZ0BSlUeFv5wI79HsdTyQpWF5hcRtDObOuJQ/viewform?usp=send_form";

const VIEWPORT = {
  width: 1280,
  height: 1000,
};
const csvData = fs.readFileSync("./input.csv")
  .toString()
  .split('\n')
  .map(e => e.trim())
  .map(e => e.split(',').map(e => e.trim()).filter(e => e))
  .filter(e => e.length);

console.log(csvData)
const xpath = {
  inputs: '//div[@class="freebirdFormviewerViewItemList"]//div[contains(text(),"回答を入力")]/preceding-sibling::input'
};
(async () => {
  /**** setup ****/
  const options = process.env.SLOW
    ? {headless: false, slowMo: 100}
    : {headless: false};
  BROWSER = await puppeteer.launch(options);
  const page = await BROWSER.newPage();
  await page.setViewport({
    width: VIEWPORT.width,
    height: VIEWPORT.height,
  });
  /**** setup ****/

  await page.goto(URL, { waitUntil: "domcontentloaded" });

  // 基本情報
  // await typeText(page, getInputXPath('メールアドレス'), csvData[0][0]);
  // await typeText(page, getInputXPath('Student'), csvData[0][1]);
  // await typeText(page, getInputXPath('Name'), csvData[0][2]);

  const basicInfoXPath = '//div[@class="freebirdFormviewerViewItemList"]//div/preceding-sibling::input';
  await page.waitForXPath(basicInfoXPath);
  const basicInfoElements = await page.$x(basicInfoXPath);
  for(let i = 0; i < 3; ++i) {
    await page.waitFor(200);
    await basicInfoElements[i].type(csvData[0][i]);
  }

  /** 手動で学籍番号を入力してもらう */
  await page.waitForXPath("//div[contains(text(), '1-1')]", {visible: true})
  console.log("学籍番号入力完了")
  /** 手動で学籍番号を入力してもらう */

  // CSVの二行目以降を入力
  for (let i = 0; i < csvData.length-1; i++) {
    await fillUpOnePage(page, csvData[i+1]);
    await clickByXPath(page, '//span[text()="次へ"]');
  }
  console.log("入力完了");
  console.log("入力を確認して送信したら、control+cなどで終了してください。ブラウザも終了します。");
})()

async function typeText(page, xpath, text) {
  const elm = await page.waitForXPath(xpath);
  await elm.type(text);
}

async function clickByXPath(page, xpath) {
  const element = await page.waitForXPath(xpath);
  await Promise.all([
    page.waitFor(500),
    element.click()
  ]);
}

async function fillUpOnePage(page, textArray) {
  await page.waitForXPath(xpath.inputs);
  await page.waitFor(500)
  const elements = await page.$x(xpath.inputs);
  if(textArray.length != elements.length) {
    console.error("csvがおかしいです");
    exit(-1);
  }
  for (let i = 0; i < textArray.length; i++) {
    await elements[i].type(textArray[i]);
  }
}

function getInputXPath(label) {
  return `//input[contains(@aria-label, "${label}")]`;
}