// pdf-parse v2 uses a class-based API: new PDFParse({data}) then .getText()
const { PDFParse } = require('pdf-parse');
const mammoth = require('mammoth');
 
const parsePDF = async (buffer) => {
  try {
    // v2 API: pass data in constructor options, then call getText()
    const parser = new PDFParse({ data: buffer });
    const result = await parser.getText();
    // result.text is the full concatenated text
    return result.text || '';
  } catch (err) {
    console.error('PDF Parse Error:', err.message);
    return buffer.toString('utf-8').replace(/[^\x20-\x7E\n]/g, '');
  }
};
 
const parseDOCX = async (buffer) => {
  try {
    const result = await mammoth.extractRawText({ buffer });
    return result.value || '';
  } catch (err) {
    return buffer.toString('utf-8').replace(/[^\x20-\x7E\n]/g, '');
  }
};
 
module.exports = { parsePDF, parseDOCX };