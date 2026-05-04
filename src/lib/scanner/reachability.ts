// src/lib/scanner/reachability.ts

// Make sure the word "export" is exactly like this:
export async function checkReachability(url: string) {
  const startTime = performance.now();

  try {
    const response = await fetch(url, {
      method: "GET",
      redirect: "follow",
      headers: {
        "User-Agent": "SEO-Bot/1.0",
      },
    });

    const endTime = performance.now();

    let errorMessage = null;

    if (!response.ok) {
      if (response.status === 403 || response.status === 401) {
        errorMessage = `Access Denied (403). The site is actively blocking automated scanners or requires authentication.`;
      } else if (response.status === 404) {
        errorMessage = `Page Not Found (404). Please ensure the URL points to an existing page.`;
      } else if (response.status >= 500) {
        errorMessage = `Server Error (500). The target website is currently experiencing technical difficulties.`;
      } else {
        errorMessage = `HTTP Error (${response.status}: ${response.statusText}).`;
      }
    } else {
      const contentType = response.headers.get("content-type");
      if (contentType && !contentType.includes("text/html")) {
        errorMessage = `Invalid Content Type. The URL must point to an HTML webpage, not a file or image.`;
      }
    }

    return {
      url,
      isReachable: response.ok && !errorMessage,
      status: response.status,
      statusText: response.statusText,
      responseTimeMs: Math.round(endTime - startTime),
      errorMessage,
    };
  } catch (error: any) {
    let errorMessage = "Connection failed or timed out. The server might be down or blocking automated requests.";
    
    // Check for specific Node.js fetch/network errors
    if (error.message && error.message.includes("ENOTFOUND")) {
      errorMessage = "Domain not found. Please check if the URL is spelled correctly and the site is online.";
    } else if (error.cause && error.cause.code === 'ENOTFOUND') {
      errorMessage = "Domain not found. Please check if the URL is spelled correctly and the site is online.";
    } else if (error.message && error.message.includes("ECONNREFUSED")) {
      errorMessage = "Connection refused. The server might be down.";
    } else if (error.name === 'TypeError' && error.message.includes('Invalid URL')) {
      errorMessage = "Invalid URL format. Please include http:// or https:// and a valid domain.";
    }

    return {
      url,
      isReachable: false,
      status: 0,
      statusText: "Network Error",
      responseTimeMs: 0,
      error: error.message,
      errorMessage,
    };
  }
}