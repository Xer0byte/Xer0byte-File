import { Format } from './types';

export const CommonFormats: Record<string, Format> = {
  // Images
  PNG: { name: 'PNG Image', extension: 'png', mime: 'image/png', category: 'image', lossless: true },
  JPEG: { name: 'JPEG Image', extension: 'jpeg', mime: 'image/jpeg', category: 'image', lossless: false },
  WEBP: { name: 'WebP Image', extension: 'webp', mime: 'image/webp', category: 'image', lossless: false },
  GIF: { name: 'GIF Image', extension: 'gif', mime: 'image/gif', category: 'image', lossless: true },
  TIFF: { name: 'TIFF Image', extension: 'tiff', mime: 'image/tiff', category: 'image', lossless: true },
  BMP: { name: 'BMP Image', extension: 'bmp', mime: 'image/bmp', category: 'image', lossless: true },
  SVG: { name: 'SVG Image', extension: 'svg', mime: 'image/svg+xml', category: 'image', lossless: true },
  ICNS: { name: 'Apple Icon Image', extension: 'icns', mime: 'image/x-icns', category: 'image', lossless: true },
  AVIF: { name: 'AVIF Image', extension: 'avif', mime: 'image/avif', category: 'image', lossless: false },
  HEIC: { name: 'HEIC Image', extension: 'heic', mime: 'image/heic', category: 'image', lossless: false },
  HEIF: { name: 'HEIF Image', extension: 'heif', mime: 'image/heif', category: 'image', lossless: false },
  JXL: { name: 'JPEG XL', extension: 'jxl', mime: 'image/jxl', category: 'image', lossless: false },
  DDS: { name: 'DirectDraw Surface', extension: 'dds', mime: 'image/vnd.ms-dds', category: 'image', lossless: true },
  EXR: { name: 'OpenEXR', extension: 'exr', mime: 'image/x-exr', category: 'image', lossless: true },
  TGA: { name: 'Truevision TGA', extension: 'tga', mime: 'image/x-tga', category: 'image', lossless: true },
  PSD: { name: 'Adobe Photoshop Document', extension: 'psd', mime: 'image/vnd.adobe.photoshop', category: 'image', lossless: true },
  ICO: { name: 'Windows Icon', extension: 'ico', mime: 'image/x-icon', category: 'image', lossless: true },
  CUR: { name: 'Windows Cursor', extension: 'cur', mime: 'image/x-icon', category: 'image', lossless: true },
  ANI: { name: 'Animated Cursor', extension: 'ani', mime: 'application/x-navi-animation', category: 'image', lossless: true },
  
  // Video
  MP4: { name: 'MP4 Video', extension: 'mp4', mime: 'video/mp4', category: 'video', lossless: false },
  WEBM: { name: 'WebM Video', extension: 'webm', mime: 'video/webm', category: 'video', lossless: false },
  AVI: { name: 'AVI Video', extension: 'avi', mime: 'video/x-msvideo', category: 'video', lossless: false },
  MKV: { name: 'MKV Video', extension: 'mkv', mime: 'video/x-matroska', category: 'video', lossless: false },
  MOV: { name: 'MOV Video', extension: 'mov', mime: 'video/quicktime', category: 'video', lossless: false },
  FLV: { name: 'Flash Video', extension: 'flv', mime: 'video/x-flv', category: 'video', lossless: false },
  WMV: { name: 'Windows Media Video', extension: 'wmv', mime: 'video/x-ms-wmv', category: 'video', lossless: false },
  M4V: { name: 'M4V Video', extension: 'm4v', mime: 'video/x-m4v', category: 'video', lossless: false },
  MPEG: { name: 'MPEG Video', extension: 'mpeg', mime: 'video/mpeg', category: 'video', lossless: false },
  TS: { name: 'MPEG Transport Stream', extension: 'ts', mime: 'video/mp2t', category: 'video', lossless: false },
  VOB: { name: 'DVD Video Object', extension: 'vob', mime: 'video/x-ms-vob', category: 'video', lossless: false },
  OGV: { name: 'Ogg Video', extension: 'ogv', mime: 'video/ogg', category: 'video', lossless: false },
  RM: { name: 'RealMedia', extension: 'rm', mime: 'application/vnd.rn-realmedia', category: 'video', lossless: false },
  SWF: { name: 'Shockwave Flash', extension: 'swf', mime: 'application/x-shockwave-flash', category: 'video', lossless: false },
  '3GP': { name: '3GPP Multimedia', extension: '3gp', mime: 'video/3gpp', category: 'video', lossless: false },
  '3G2': { name: '3GPP2 Multimedia', extension: '3g2', mime: 'video/3gpp2', category: 'video', lossless: false },

  // Audio
  MP3: { name: 'MP3 Audio', extension: 'mp3', mime: 'audio/mpeg', category: 'audio', lossless: false },
  WAV: { name: 'WAV Audio', extension: 'wav', mime: 'audio/wav', category: 'audio', lossless: true },
  OGG: { name: 'OGG Audio', extension: 'ogg', mime: 'audio/ogg', category: 'audio', lossless: false },
  AAC: { name: 'AAC Audio', extension: 'aac', mime: 'audio/aac', category: 'audio', lossless: false },
  FLAC: { name: 'FLAC Audio', extension: 'flac', mime: 'audio/flac', category: 'audio', lossless: true },
  M4A: { name: 'M4A Audio', extension: 'm4a', mime: 'audio/mp4', category: 'audio', lossless: false },
  WMA: { name: 'Windows Media Audio', extension: 'wma', mime: 'audio/x-ms-wma', category: 'audio', lossless: false },
  ALAC: { name: 'Apple Lossless', extension: 'alac', mime: 'audio/alac', category: 'audio', lossless: true },
  OPUS: { name: 'Opus Audio', extension: 'opus', mime: 'audio/opus', category: 'audio', lossless: false },
  AMR: { name: 'AMR Audio', extension: 'amr', mime: 'audio/amr', category: 'audio', lossless: false },
  AIFF: { name: 'Audio Interchange File Format', extension: 'aiff', mime: 'audio/x-aiff', category: 'audio', lossless: true },
  MID: { name: 'MIDI Audio', extension: 'mid', mime: 'audio/midi', category: 'audio', lossless: true },
  MOD: { name: 'Tracker Module', extension: 'mod', mime: 'audio/mod', category: 'audio', lossless: true },
  IT: { name: 'Impulse Tracker', extension: 'it', mime: 'audio/it', category: 'audio', lossless: true },
  S3M: { name: 'Scream Tracker 3', extension: 's3m', mime: 'audio/s3m', category: 'audio', lossless: true },
  XM: { name: 'FastTracker 2', extension: 'xm', mime: 'audio/xm', category: 'audio', lossless: true },

  // Documents
  PDF: { name: 'PDF Document', extension: 'pdf', mime: 'application/pdf', category: 'document', lossless: true },
  PAGES: { name: 'Apple Pages Document', extension: 'pages', mime: 'application/x-iwork-pages-sffpages', category: 'document', lossless: true },
  KEYNOTE: { name: 'Apple Keynote Presentation', extension: 'key', mime: 'application/x-iwork-keynote-sffkey', category: 'document', lossless: true },
  DOCX: { name: 'Word Document', extension: 'docx', mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', category: 'document', lossless: true },
  PPTX: { name: 'PowerPoint Presentation', extension: 'pptx', mime: 'application/vnd.openxmlformats-officedocument.presentationml.presentation', category: 'document', lossless: true },
  TXT: { name: 'Plain Text', extension: 'txt', mime: 'text/plain', category: 'document', lossless: true },
  JSON: { name: 'JSON Data', extension: 'json', mime: 'application/json', category: 'document', lossless: true },
  XML: { name: 'XML Data', extension: 'xml', mime: 'application/xml', category: 'document', lossless: true },
  YML: { name: 'YAML Data', extension: 'yml', mime: 'application/yaml', category: 'document', lossless: true },
  HTML: { name: 'HTML Document', extension: 'html', mime: 'text/html', category: 'document', lossless: true },
  MD: { name: 'Markdown', extension: 'md', mime: 'text/markdown', category: 'document', lossless: true },
  BSON: { name: 'BSON Data', extension: 'bson', mime: 'application/bson', category: 'document', lossless: true },
  ODT: { name: 'OpenDocument Text', extension: 'odt', mime: 'application/vnd.oasis.opendocument.text', category: 'document', lossless: true },
  ODP: { name: 'OpenDocument Presentation', extension: 'odp', mime: 'application/vnd.oasis.opendocument.presentation', category: 'document', lossless: true },
  RTF: { name: 'Rich Text Format', extension: 'rtf', mime: 'application/rtf', category: 'document', lossless: true },
  EPUB: { name: 'EPUB eBook', extension: 'epub', mime: 'application/epub+zip', category: 'document', lossless: true },

  // Spreadsheets
  XLSX: { name: 'Excel Spreadsheet', extension: 'xlsx', mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', category: 'spreadsheet', lossless: true },
  NUMBERS: { name: 'Apple Numbers Spreadsheet', extension: 'numbers', mime: 'application/x-iwork-numbers-sffnumbers', category: 'spreadsheet', lossless: true },
  CSV: { name: 'CSV File', extension: 'csv', mime: 'text/csv', category: 'spreadsheet', lossless: true },
  ODS: { name: 'OpenDocument Spreadsheet', extension: 'ods', mime: 'application/vnd.oasis.opendocument.spreadsheet', category: 'spreadsheet', lossless: true },

  // Archives & Packages
  ZIP: { name: 'ZIP Archive', extension: 'zip', mime: 'application/zip', category: 'archive', lossless: true },
  APK: { name: 'Android Package (APK)', extension: 'apk', mime: 'application/vnd.android.package-archive', category: 'archive', lossless: true },
  AAB: { name: 'Android App Bundle', extension: 'aab', mime: 'application/x-authorware-bin', category: 'archive', lossless: true },
  OBB: { name: 'Android Opaque Binary Blob', extension: 'obb', mime: 'application/octet-stream', category: 'archive', lossless: true },
  IPA: { name: 'iOS App Store Package', extension: 'ipa', mime: 'application/octet-stream', category: 'archive', lossless: true },
  DMG: { name: 'Apple Mac Disk Image', extension: 'dmg', mime: 'application/x-apple-diskimage', category: 'archive', lossless: true },
  PKG: { name: 'Apple Mac Installer Package', extension: 'pkg', mime: 'application/x-newton-compatible-pkg', category: 'archive', lossless: true },
  MSI: { name: 'Windows Installer Package', extension: 'msi', mime: 'application/x-msi', category: 'archive', lossless: true },
  APPX: { name: 'Windows App Package', extension: 'appx', mime: 'application/appx', category: 'archive', lossless: true },
  WAD: { name: 'WAD Archive', extension: 'wad', mime: 'application/x-doom', category: 'archive', lossless: true },
  RAR: { name: 'RAR Archive', extension: 'rar', mime: 'application/vnd.rar', category: 'archive', lossless: true },
  '7Z': { name: '7-Zip Archive', extension: '7z', mime: 'application/x-7z-compressed', category: 'archive', lossless: true },
  TAR: { name: 'Tar Archive', extension: 'tar', mime: 'application/x-tar', category: 'archive', lossless: true },
  GZ: { name: 'Gzip Archive', extension: 'gz', mime: 'application/gzip', category: 'archive', lossless: true },
  JAR: { name: 'Java Archive', extension: 'jar', mime: 'application/java-archive', category: 'archive', lossless: true },
  CBZ: { name: 'Comic Book Archive', extension: 'cbz', mime: 'application/vnd.comicbook+zip', category: 'archive', lossless: true },

  // Code & Scripts
  BATCH: { name: 'Windows Batch', extension: 'bat', mime: 'text/windows-batch', category: 'code', lossless: true },
  PYTHON: { name: 'Python Script', extension: 'py', mime: 'text/x-python', category: 'code', lossless: true },
  SH: { name: 'Shell Script', extension: 'sh', mime: 'application/x-sh', category: 'code', lossless: true },
  EXE: { name: 'Windows Executable', extension: 'exe', mime: 'application/vnd.microsoft.portable-executable', category: 'code', lossless: true },
  DLL: { name: 'Dynamic Link Library', extension: 'dll', mime: 'application/x-msdownload', category: 'code', lossless: true },

  // Fonts
  TTF: { name: 'TrueType Font', extension: 'ttf', mime: 'font/ttf', category: 'font', lossless: true },
  OTF: { name: 'OpenType Font', extension: 'otf', mime: 'font/otf', category: 'font', lossless: true },
  WOFF: { name: 'Web Open Font Format', extension: 'woff', mime: 'font/woff', category: 'font', lossless: true },
  WOFF2: { name: 'Web Open Font Format 2', extension: 'woff2', mime: 'font/woff2', category: 'font', lossless: true },

  // 3D Models
  GLB: { name: 'GL Transmission Format Binary', extension: 'glb', mime: 'model/gltf-binary', category: 'document', lossless: true },
  GLTF: { name: 'GL Transmission Format', extension: 'gltf', mime: 'model/gltf+json', category: 'document', lossless: true },
  OBJ: { name: 'Wavefront OBJ', extension: 'obj', mime: 'model/obj', category: 'document', lossless: true },

  // Other
  MUSICXML: { name: 'MusicXML', extension: 'musicxml', mime: 'application/vnd.recordare.musicxml+xml', category: 'document', lossless: true },
  MXL: { name: 'MusicXML Compressed', extension: 'mxl', mime: 'application/vnd.recordare.musicxml', category: 'document', lossless: true },
  TOON: { name: 'Toon Format', extension: 'toon', mime: 'application/x-toon', category: 'document', lossless: true },
  SQLITE3: { name: 'SQLite Database', extension: 'sqlite3', mime: 'application/vnd.sqlite3', category: 'document', lossless: true },
  NBT: { name: 'Named Binary Tag', extension: 'nbt', mime: 'application/x-nbt', category: 'document', lossless: true },
  SCHEMATIC: { name: 'Minecraft Schematic', extension: 'schematic', mime: 'application/x-minecraft-schematic', category: 'document', lossless: true },
  ASEPRITE: { name: 'Aseprite Sprite', extension: 'aseprite', mime: 'application/x-aseprite', category: 'image', lossless: true },
  Z64: { name: 'N64 ROM', extension: 'z64', mime: 'application/x-n64-rom', category: 'archive', lossless: true },
};

// Add all the other requested formats dynamically
const extraFormats = [
  '3DOSTR', '4XM', 'AA', 'AAX', 'AC3', 'ACE', 'ACM', 'ACT', 'ADF', 'ADP', 'ADS', 'ADX', 'AEA', 'AFC', 'AIX', 'ALAW', 'ALIAS_PIX', 'ALP', 'AMRNB', 'AMRWB', 'ANM', 'APC', 'APE', 'APM', 'APNG', 'APTX', 'APTX_HD', 'ARGO_ASF', 'ARGO_BRP', 'ARGO_CVG', 'ASF', 'ASF_O', 'AST', 'AU', 'AV1', 'AVR', 'AVS', 'AVS2', 'AVS3', 'BETHSOFTVID', 'BFI', 'BFSTM', 'BIN', 'BIK', 'BINKA', 'BIT', 'BITPACKED', 'BMV', 'BOA', 'BRENDER_PIX', 'BRSTM', 'C93', 'CAF', 'CAVSVIDEO', 'CDG', 'CDXL', 'CINE', 'CODEC2', 'CODEC2RAW', 'CONCAT', 'DATA', 'DAUD', 'DCSTR', 'DERF', 'DFA', 'DFPWM', 'DHAV', 'DIRAC', 'DNXHD', 'DSF', 'DSICIN', 'DSS', 'DTS', 'DTSHD', 'DV', 'DVBSUB', 'DVBTXT', 'DXA', 'EA', 'EA_CDATA', 'EAC3', 'EPAF', 'F32BE', 'F32LE', 'F64BE', 'F64LE', 'FFMETADATA', 'FILM_CPK', 'FILMSTRIP', 'FITS', 'FLIC', 'FRM', 'FSB', 'FWSE', 'G722', 'G723_1', 'G726', 'G726LE', 'G729', 'GDV', 'GENH', 'GSM', 'GXF', 'H261', 'H263', 'H264', 'HCA', 'HCOM', 'HLS', 'HNM', 'IDCIN', 'IDF', 'IFF', 'IFV', 'ILBC', 'IMAGE2', 'INGENIENT', 'IPMOVIE', 'IPU', 'IRCAM', 'ISS', 'IV8', 'IVF', 'IVR', 'JV', 'KUX', 'KVAG', 'LAVFI', 'LIVE_FLV', 'LMLM4', 'LOAS', 'LRC', 'LUODAT', 'LVF', 'LXF', 'MATROSKA', 'MCA', 'MCC', 'MGSTS', 'MJPEG', 'MJPEG_2000', 'MLP', 'MLV', 'MM', 'MMF', 'MODS', 'MOFLEX', 'MJ2', 'MPC', 'MPC8', 'MPEGTS', 'MPEGTSRAW', 'MPEGVIDEO', 'MPJPEG', 'MSF', 'MSNWCTCP', 'MSP', 'MTAF', 'MTV', 'MULAW', 'MUSX', 'MV', 'MVI', 'MXF', 'MXG', 'NC', 'NISTSPHERE', 'NSP', 'NSV', 'NUT', 'NUV', 'OBU', 'OMA', 'PAF', 'PMP', 'PP_BNK', 'PSXSTR', 'PVA', 'PVF', 'QCP', 'R3D', 'RAWVIDEO', 'REDSPARK', 'RL2', 'ROQ', 'RPL', 'RSD', 'RSO', 'RTP', 'S16BE', 'S16LE', 'S24BE', 'S24LE', 'S32BE', 'S32LE', 'S337M', 'S8', 'SAP', 'SBC', 'SBG', 'SCC', 'SCD', 'SDP', 'SDR2', 'SDS', 'SDX', 'SER', 'SGA', 'SHN', 'SIFF', 'SIMBIOSIS_IMX', 'SLN', 'SMJPEG', 'SMK', 'SMUSH', 'SOL', 'SOX', 'SPDIF', 'SVAG', 'SVS', 'TAK', 'TEDCAPTIONS', 'THP', 'TIERTEXSEQ', 'TMV', 'TRUEHD', 'TTA', 'TTY', 'TXD', 'TY', 'U16BE', 'U16LE', 'U24BE', 'U24LE', 'U32BE', 'U32LE', 'U8', 'V210', 'V210X', 'VAG', 'VC1', 'VC1TEST', 'VIDC', 'VIVIDAS', 'VIVO', 'VMD', 'VOC', 'VPK', 'VQF', 'W64', 'WC3MOVIE', 'WSAUD', 'WSD', 'WSVQA', 'WTV', 'WV', 'WVE', 'XA', 'XBIN', 'XMV', 'XVAG', 'XWMA', 'YOP', 'YUV4MPEGPIPE', 'QTA', 'BMP2', 'BMP3', 'DCM', 'DCR', 'DNG', 'EPI', 'EPS', 'EPSF', 'EPSI', 'G3', 'GIF87', 'GROUP4', 'J2C', 'J2K', 'JNG', 'JP2', 'JPC', 'JPE', 'JPM', 'JPS', 'JPT', 'MPO', 'MSL', 'PAM', 'PBM', 'PCL', 'PCT', 'PCX', 'PDB', 'PFA', 'PFB', 'PFM', 'PGM', 'PJPEG', 'PNG00', 'PNG24', 'PNG32', 'PNG48', 'PNG64', 'PNG8', 'PNM', 'PPM', 'PS', 'PSB', 'PTIF', 'RAS', 'RGB', 'SF3', 'SGI', 'STI', 'SVGZ', 'TIFF64', 'TTC', 'VST', 'WBMP', 'XBM', 'XPM', 'XPS', 'BUNLEVEL', 'RGBA', 'XPI', 'LOVE', 'OSZ', 'OSK', 'APWORLD', 'SB3', 'IPA', 'APP', 'QOI', 'DEM', 'ITDB', 'VTF', 'MCMAP', 'ALS', 'QOA', 'SNBT', 'FLP', 'FLO', 'CGBI-PNG', 'UTF-16 LE', 'UTF-16 BE', 'UTF-32 LE', 'UTF-32 BE', 'MPTM', '667', '669', 'AMF', 'AMS', 'C67', 'CBA', 'DBM', 'DIGI', 'DMF', 'DSM', 'DSYM', 'DTM', 'ETX', 'FAR', 'FC', 'FC13', 'FC14', 'FMT', 'FST', 'FTM', 'GDM', 'GMC', 'GTK', 'GT2', 'ICE', 'IMF', 'IMS', 'J2B', 'M15', 'MDL', 'MED', 'MMCMP', 'MMS', 'MO3', 'MT2', 'MTM', 'MUS', 'NST', 'OKT', 'OXM', 'PLM', 'PSM', 'PT36', 'PTM', 'PUMA', 'PPM', 'RTM', 'SFX', 'SFX2', 'SMOD', 'ST26', 'STK', 'STM', 'STX', 'STP', 'SYMMOD', 'TCB', 'ULT', 'UMX', 'UNIC', 'WOW', 'XMF', 'XPK', 'RTTTL', 'GRUB', 'LZH', 'ASCIIDOC', 'BIBLATEX', 'BIBTEX', 'BITS', 'COMMONMARK', 'COMMONMARK_X', 'CREOLE', 'DJOT', 'DOKUWIKI', 'ENDNOTEXML', 'FB2', 'GFM', 'HADDOCK', 'IPYNB', 'JIRA', 'LATEX', 'MAN', 'MARKDOWN', 'MARKDOWN_GITHUB', 'MARKDOWN_MMD', 'MARKDOWN_PHPEXTRA', 'MARKDOWN_STRICT', 'MDOC', 'MEDIAWIKI', 'MUSE', 'NATIVE', 'OPML', 'ORG', 'POD', 'RIS', 'RST', 'T2T', 'TEXTILE', 'TIKIWIKI', 'TSV', 'TWIKI', 'TYPST', 'VIMWIKI', 'CSLJSON', 'DOCBOOK', 'JATS', 'BSOR', 'SCHEM', 'LITEMATIC', 'N64', 'V64', 'RPGMVP', 'OTA', 'WLD',
  'ISO', 'DMG', 'BZ2', 'XZ', 'DEB', 'RPM', 'CAB', 'MDF', 'NRG', 'CUE', 'VDI', 'VMDK', 'VHD', 'QCOW2', 'IMG', 'MDS', 'TC', 'VHDX', 'WIM', 'SWM', 'ESD', 'FLA', 'AEP', 'PRPROJ', 'C4D', 'BLEND', 'MAX', 'MA', 'MB', 'FBX', 'DAE', 'STL', 'STEP', 'IGES', 'DWG', 'DXF', 'SKP', 'RVT', 'VWX', 'PLN', '3DS', 'LWO', 'LWS', 'XSI', 'ZPR', 'ZTL', 'SPP', 'SBS', 'SBSAR', 'KRA', 'CLIP', 'SAI', 'XCF', 'CDR', 'AI', 'INDD', 'PUB', 'QXP', 'SMC', 'NES', 'GB', 'GBC', 'GBA', 'NDS', 'XCI', 'WBFS', 'CSO', 'PKG'
];

extraFormats.forEach(ext => {
  const upper = ext.toUpperCase().replace(/[^A-Z0-9]/g, '_');
  if (!CommonFormats[upper]) {
    CommonFormats[upper] = {
      name: `${ext.toUpperCase()} File`,
      extension: ext.toLowerCase(),
      mime: `application/x-${ext.toLowerCase()}`,
      category: 'other' as any, // Default category
      lossless: true
    };
  }
});

export const ALL_FORMATS = Object.values(CommonFormats);
