const fetch = require("node-fetch");
const sharp = require("sharp");

exports.handler = async (event) => {
  console.log(event);
  try {
    const { f, w, h } = event.queryStringParameters;
    const width = parseInt(w);
    const height = parseInt(h);
    if (
      !f ||
      Number.isNaN(width) ||
      Number.isNaN(height) ||
      width < 1 ||
      width > 3200 ||
      height < 1 ||
      height > 3200
    ) {
      throw {
        status: 400,
        code: "invalid::input",
        message: "f or w or h is bad or missing",
      };
    }

    const response = await fetch(`${process.env.BASE_URL}${f}`);
    const buffer = await sharp(await response.buffer())
      .resize({
        width,
        height,
        fit: "cover",
        withoutEnlargement: true,
      })
      .toBuffer();

    const headers = getResponseHeaders();
    headers["Content-Type"] = response.headers.get("content-type") || "image";
    headers["Cache-Control"] = "max-age=31536000,public";

    return {
      statusCode: 200,
      headers: headers,
      body: buffer.toString("base64"),
      isBase64Encoded: true,
    };
  } catch (err) {
    console.log(err);

    return {
      statusCode: err.status || 500,
      headers: getResponseHeaders(true),
      body: JSON.stringify(err),
      isBase64Encoded: false,
    };
  }
};

const getResponseHeaders = (isErr) => {
  const corsEnabled = process.env.CORS_ENABLED === "Yes";
  const headers = {
    "Access-Control-Allow-Methods": "GET",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Credentials": true,
  };
  if (corsEnabled) {
    headers["Access-Control-Allow-Origin"] = process.env.CORS_ORIGIN;
  }
  if (isErr) {
    headers["Content-Type"] = "application/json";
  }
  return headers;
};
