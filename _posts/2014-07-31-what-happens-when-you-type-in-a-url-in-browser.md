---
layout: post
cover: false
title:  What happens when you type in a URL in browser
date:   2014-07-31 18:30:12
tags: machine
subclass: 'post tag-machine'
categories: 'hetao'
chinese: false 
---

When you type a URL into your browser's address bar and press Enter, a series of intricate steps are triggered to retrieve and display the desired web page. Here's an outline of this process, assuming the simplest possible scenario involving an HTTP request, no proxies, and IPv4.

#### 1. **Cache Check**

First, the browser checks its cache to see if it has a fresh copy of the requested resource. If the resource is found and is still fresh, the browser can skip many subsequent steps and immediately proceed to rendering the page.

#### 2. **Resolving the Server's IP Address**

If the resource is not in the cache, the browser needs to determine the IP address of the server hosting the website. It asks the operating system (OS) for this information.

#### 3. **DNS Lookup**

The OS performs a DNS lookup to translate the human-readable domain name (e.g., `www.example.com`) into an IP address (e.g., `192.0.2.1`). Once the OS obtains the IP address, it returns this information to the browser.

#### 4. **Establishing a TCP Connection**

Armed with the server's IP address, the browser initiates a TCP (Transmission Control Protocol) connection to the server. This involves a handshake process to ensure a reliable and ordered communication channel. This step is significantly more complex if the connection uses HTTPS, involving additional steps for encryption and security.

#### 5. **Sending the HTTP Request**

With the TCP connection established, the browser sends an HTTP request to the server. This request typically includes the method (e.g., GET, POST), the path of the resource, headers, and possibly a body (for POST requests).

#### 6. **Receiving the HTTP Response**

The server processes the HTTP request and sends back a response. The browser receives this response and may close the TCP connection or keep it open for subsequent requests, depending on the connection settings.

#### 7. **Handling the Response**

Upon receiving the response, the browser checks the status code to determine the next steps. For instance, if the response indicates a redirect (status codes 3xx), the browser will follow the new location. If it indicates an authorization request (status code 401), the browser will prompt the user for credentials. Error responses (status codes 4xx and 5xx) are handled differently from successful responses (status codes 2xx).

#### 8. **Caching the Response**

If the response is cacheable, the browser stores it in the cache for future use. This helps in speeding up subsequent requests for the same resource.

#### 9. **Decoding the Response**

The browser decodes the response if necessary. For example, if the response is compressed (e.g., gzipped), the browser decompresses it to obtain the original content.

#### 10. **Determining the Response Type**

Next, the browser determines the type of the response to decide what to do with it. This could be an HTML page, an image, a sound clip, or any other type of resource.

#### 11. **Rendering the Page**

Finally, the browser renders the response. If the response is an HTML page, it will parse the HTML, apply styles from CSS, and execute JavaScript to construct and display the web page. For other types of resources, such as images or videos, the browser will render them accordingly or offer a download dialog if the type is unrecognized.

### Additional Processes

While the steps above outline the core process, several other activities occur in parallel:

- **Processing the Typed-In Address**: As the URL is typed, the browser predicts and autocompletes possible addresses based on history and bookmarks.
- **Adding Page to Browser History**: Once the page loads, the URL is added to the browser's history for future reference.
- **Displaying Progress**: The browser updates the progress bar or spinner to indicate the loading status.
- **Notifying Plugins and Extensions**: Any active plugins or extensions are notified of the new page load.
- **Rendering While Downloading**: Modern browsers start rendering the page as soon as enough data is received, even before the full page is downloaded.
- **Pipelining and Connection Tracking**: For performance, the browser may send multiple requests in parallel or reuse open connections for multiple resources.

### Conclusion

Typing a URL into a browser triggers a sophisticated sequence of actions that involves networking, data processing, and rendering to deliver a seamless browsing experience. Each step, from resolving the server's IP address to rendering the final page, is optimized for efficiency and speed, ensuring that users can access web resources quickly and reliably. Understanding this process not only highlights the complexity behind a simple action but also emphasizes the technological advancements that make modern web browsing possible.