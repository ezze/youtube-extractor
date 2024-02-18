# youtube-extractor

## Build

1. Install dependencies:

   ```
   yarn
   ```

2. Build the package:

   ```
   yarn package
   ```

3. Find the results for your OS in `out` directory.

## Command line usage

- Single video download:

   ```
   ./youtube-extractor -- https://www.youtube.com/watch?v=ByTuHDdZOX8
   ```
  
- Specify output directory:

   ```
   ./youtube-extractor --output ./output https://www.youtube.com/watch?v=ByTuHDdZOX8
   ```

- Bulk video download:

   ```
   ./youtube-extractor -- https://www.youtube.com/watch?v=cbB3iGRHtqA https://www.youtube.com/watch?v=rbUVR-qLTvk https://www.youtube.com/watch?v=4YxTa1AUqps
   ```
  
- Bulk video download specifying Youtube video identifiers only:

   ```
   ./youtube-extractor -- cbB3iGRHtqA rbUVR-qLTvk 4YxTa1AUqps
   ```
  
- Use source file to download:

   ```
   ./youtube-extractor -- source
   ``` 
  
   where source file contents are the following:

   ```
   https://www.youtube.com/watch?v=j0LD2GnxmKU
   https://www.youtube.com/watch?v=F4w5UjMJAFY
   https://www.youtube.com/watch?v=oU6reaacRmw
   https://www.youtube.com/watch?v=BBQ36Y1GL1g
   1V84Xz1Z6dY
   neqFpWDQ61w
   iOG9nTLBKhE
   ```
  
   Lines commented by `#` or `//` will not be processed.

- Extract audio only and save it in original format:

   ```
   ./youtube-extractor --audio original ByTuHDdZOX8
   ``` 

- Extract audio only and save it in mp3:

   ```
   ./youtube-extractor --audio mp3 ByTuHDdZOX8
   ```

- Help is always available:

   ```
   ./youtube-extractor -- --help
   ```
