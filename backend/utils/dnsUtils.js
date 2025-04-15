import dns from "dns";

export function checkDNSConnection(hostname) {
  return new Promise((resolve, reject) => {
    dns.resolve(hostname, (err, addresses) => {
      if (err) {
        console.error("DNS Resolution Error:", err);
        reject(err);
      } else {
        console.log("DNS Resolution Successful:", addresses);
        resolve(addresses);
      }
    });
  });
}

export function getHostname(url) {
  try {
    return new URL(url).hostname;
  } catch (error) {
    console.error("Invalid URL:", url);
    return null;
  }
}
