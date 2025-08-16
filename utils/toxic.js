const axios = require("axios");

async function isCommentToxic(commentText) {
  try {
    const response = await axios.post("http://127.0.0.1:5001/check-comment", {
      comment: commentText
    });
    const { label, score } = response.data;
    // Threshold 0.8 set kar diya, tu apna adjust kar sakta hai
    if (label === "toxic" && score > 0.8) {
      return true;  // toxic
    }
    return false;   // safe
  } catch (error) {
    console.error("Error checking toxicity:", error.message);
    // agar API fail ho jaye, safe side me comment allow karna better hoga
    return false;
  }
}


module.exports = {
  isCommentToxic
};