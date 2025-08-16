// captionUtils.js
const axios = require("axios");
const fs = require("fs");
const FormData = require("form-data");

async function generateImageCaption(imagePath) {
  try {
    if (!fs.existsSync(imagePath)) {
      throw new Error(`Image not found at path: ${imagePath}`);
    }

    const formData = new FormData();
    formData.append("image", fs.createReadStream(imagePath));

    const response = await axios.post(
      "http://127.0.0.1:5001/generate-caption",
      formData,
      {
        headers: formData.getHeaders(),
        maxBodyLength: Infinity // large image upload safe
      }
    );

    return response.data; // { caption: "..." }
  } catch (error) {
    console.error("❌ Error generating caption:", error?.response?.data || error.message);
    return { error: "Caption generation failed" };
  }
}

module.exports = {
  generateImageCaption
};
