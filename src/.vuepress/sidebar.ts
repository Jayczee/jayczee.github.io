import { sidebar } from "vuepress-theme-hope";
import { fs, path } from "vuepress/utils";

const getOrderFromFile = (filePath) => {
  const data = fs.readFileSync(filePath, 'utf8');
  const lines = data.split('\n').slice(0, 10);

  for (const line of lines) {
    const match = line.match(/order:\s*(\d+)/);
    if (match) {
      return parseInt(match[1], 10);
    }
  }
  return Infinity; 
};

const getFiles = (dir) => {
  const files = fs.readdirSync(dir).filter(file => file.endsWith('.md') && file !== 'README.md');

  return files
    .map(file => ({
      name: file,
      path: path.join(dir, file),
      order: getOrderFromFile(path.join(dir, file))
    }))
    .sort((a, b) => {
      if (a.order !== b.order) {
        return a.order - b.order;
      }
      return a.name.localeCompare(b.name);
    })
    .map(file => file.name);
};

const nasChildren = getFiles(path.join(__dirname, '../nas'));
const codeChildren = getFiles(path.join(__dirname, '../code'));
const nasBasicChildren = getFiles(path.join(__dirname, '../nas/basic'));
const nasOptionalChildren = getFiles(path.join(__dirname, '../nas/optional'));
const winLinuxChildren = getFiles(path.join(__dirname, '../win_linux'));
const noteChildren = getFiles(path.join(__dirname, '../note'));
const noteLeet150Children = getFiles(path.join(__dirname, '../note/leet150'));
const etcChildren = getFiles(path.join(__dirname, '../etc'));

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
  ],
  "/etc":[
    ...etcChildren
  ]
});
