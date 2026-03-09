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
const projectsChildren = getFiles(path.join(__dirname, '../projects'));
const nasBasicChildren = getFiles(path.join(__dirname, '../nas/basic'));
const nasOptionalChildren = getFiles(path.join(__dirname, '../nas/optional'));
const systemChildren = getFiles(path.join(__dirname, '../system'));
const notesChildren = getFiles(path.join(__dirname, '../notes'));
const notesLeet150Children = getFiles(path.join(__dirname, '../notes/leet150'));
const notesJapaneseChildren = getFiles(path.join(__dirname, '../notes/ni-hon-go-grammar'));
const blogChildren = getFiles(path.join(__dirname, '../blog'));

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
  "/projects":[
    ...projectsChildren
  ],
  "/system":[
    ...systemChildren
  ],
  "/notes":[
    ...notesChildren,
    {
      text: "日语 0-N1 语法 by 日语翻译小昊子",
      collapsible: true,
      expanded: false,
      prefix: "ni-hon-go-grammar/",
      children: notesJapaneseChildren
    },
    {
      text: "LeetCode 面试经典 150 题",
      collapsible: true,
      expanded: false,
      prefix: "leet150/",
      children: notesLeet150Children
    },
  ],
  "/blog":[
    ...blogChildren
  ]
});
