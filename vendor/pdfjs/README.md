# PDF.js runtime

This directory vendors the browser runtime from Mozilla PDF.js `pdfjs-dist` version `6.5.438`.

- Source package: `https://registry.npmjs.org/pdfjs-dist/-/pdfjs-dist-6.5.438.tgz`
- Package integrity: `sha512-vg8Pw1x+AFKy4AMDvhuWl5cOYV8d698UoEANoFFhc79hqXDnZQqnOXoxw3HG907WHOg1JYOvLhP756boddFxpA==`
- Included files: `build/pdf.min.mjs`, `build/pdf.worker.min.mjs`, and the upstream Apache-2.0 `LICENSE`

The files are kept local so the installed PWA can initialize its PDF renderer without depending on a third-party CDN at launch.
