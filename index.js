import { promises as fs } from 'fs';
import { translate } from './utils.js';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkStringify from 'remark-stringify';

// Volcano Engine Translation API 配置
const ACCESS_KEY = process.env.VOLCANO_ACCESS_KEY;
const SECRET_KEY = process.env.VOLCANO_SECRET_KEY;

async function translateMarkdown(content, targetLanguage) {
    const processor = unified()
        .use(remarkParse)
        .use(remarkStringify);

    const tree = processor.parse(content);
    const textNodes = [];
    const nodeMap = new Map();

    function collectTextNodes(node) {
        if (node.type === 'text') {
            textNodes.push(node.value);
            nodeMap.set(node.value, node);
        }
        if (node.children) {
            for (let child of node.children) {
                collectTextNodes(child);
            }
        }
    }

    for (let node of tree.children) {
        collectTextNodes(node);
    }

    if (textNodes.length > 0) {
        const translations = await translate(textNodes, targetLanguage, {
            accessKeyId: ACCESS_KEY,
            secretAccessKey: SECRET_KEY
        });

        translations.forEach((translation, index) => {
            const originalText = textNodes[index];
            const node = nodeMap.get(originalText);
            if (node) {
                node.value = translation;
            }
        });
    }

    return processor.stringify(tree);
}

async function translateFile(sourcePath, targetPath, targetLanguage) {
    try {
        const content = await fs.readFile(sourcePath, 'utf8');
        const translation = await translateMarkdown(content, targetLanguage);
        await fs.writeFile(targetPath, translation, 'utf8');
        console.log(`翻译完成。文件已保存至：${targetPath}`);
    } catch (error) {
        console.error('翻译过程中发生错误：', error.message);
        throw error;
    }
}

// 主程序
(async () => {
    try {
        const sourcePath = process.argv[2];
        const targetPath = process.argv[3];
        const targetLanguage = process.argv[4] || 'en';

        if (!sourcePath || !targetPath) {
            console.error('使用方法: node index.js <源文件路径> <目标文件路径> [目标语言]');
            process.exit(1);
        }

        await translateFile(sourcePath, targetPath, targetLanguage);
    } catch (error) {
        console.error('程序执行失败：', error.message);
        process.exit(1);
    }
})();