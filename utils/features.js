import DataURIParser from "datauri/parser.js";
import path from "path";

export const getDataUri = (file) => {
  if (!file || !file.originalname) {
    throw new Error("Invalid file object or original name is missing");
  }
  
  const parser = new DataURIParser();
  const extName = path.extname(file.originalname).toString();
  return parser.format(extName, file.buffer);
};
