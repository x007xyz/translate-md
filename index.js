const fs = require('fs').promises;
const { translate } = require('./utils');
const marked = require('marked');

// Volcano Engine Translation API 配置
const ACCESS_KEY = process.env.VOLCANO_ACCESS_KEY;
const SECRET_KEY = process.env.VOLCANO_SECRET_KEY;

async function translateMarkdown(content, targetLanguage) {
    const tokens = marked.lexer(content);
    const translatedTokens = await Promise.all(tokens.map(async (token) => {
        if (token.type === 'paragraph' || token.type === 'text') {
            token.text = await translate(token.text, targetLanguage, {
                accessKeyId: ACCESS_KEY,
                secretAccessKey: SECRET_KEY
            });
        }
        return token;
    }));
    return marked.parser(translatedTokens);
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