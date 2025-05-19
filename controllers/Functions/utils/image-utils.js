import fs from "fs/promises";

/**
 * Converts an image file to a base64 string.
 * @param {string} filePath - The path to the image file.
 * @returns {Promise<string>} - The base64 encoded string of the image.
 */
export async function imageFileToBase64(filePath) {
  try {
    const imageBuffer = await fs.readFile(filePath);
    return imageBuffer.toString("base64");
  } catch (error) {
    console.error("Error converting image to base64:", error);
    throw error;
  }
}
