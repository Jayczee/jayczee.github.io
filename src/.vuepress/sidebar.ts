import { sidebar } from "vuepress-theme-hope";
import { fs, path } from "vuepress/utils";

const getFiles = (dir) => {
  return fs.readdirSync(dir).filter(file => file.endsWith('.md'));
};

const nasChildren = getFiles(path.join(__dirname, '../nas'));
const codeChildren = getFiles(path.join(__dirname, '../code'));
const nasBasicChildren = getFiles(path.join(__dirname, '../nas/basic'));
const nasOptionalChildren = getFiles(path.join(__dirname, '../nas/optional'));
const winLinuxChildren = getFiles(path.join(__dirname, '../win_linux'));
const noteChildren = getFiles(path.join(__dirname, '../note'));
const noteLeet150Children = getFiles(path.join(__dirname, '../note/leet150'));

export default sidebar({
  "/": [
    "",
  ],
  "/nas":[
    "",
    {
      text: "基建服务",
      collapsible: true,
      expanded: true,
      prefix: "basic/",
      children: nasBasicChildren
    },
    {
      text: "可选服务",
      collapsible: true,
      expanded: true,
      prefix: "optional/",
      children: nasOptionalChildren
    },
    ...nasChildren
  ],
  "/code":[
    ...codeChildren
  ],
  "/win_linux":[
    ...winLinuxChildren
  ],
  "/note":[
    ...noteChildren,
    {
      text: "LeetCode面试经典150题",
      collapsible: true,
      expanded: false,
      prefix: "leet150/",
      children: noteLeet150Children
    },
  ]
});
