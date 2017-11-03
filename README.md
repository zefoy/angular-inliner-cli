# Angular inline CLI

<a href="https://badge.fury.io/js/angular-inliner-cli"><img src="https://badge.fury.io/js/angular-inliner-cli.svg" align="right" alt="npm version" height="18"></a>

Inlines template and styles for compiled Angular components, modifies the compiled component and metadata files.

### Installing

```bash
$ npm install angular-inliner-cli --save
```

### Usage

```bash
ngi [-s|--silent] [-c|--compress] <directory>

  -s, --silent     Output only critical errors
  -c, --compress   Compress files before inlining

  <directory>      Directory where the compiled files are
```

### Examples

```bash
ngi --compress dist/lib/
```

This would take all component.js and component.metadata.json files and recursively replace the templateUrl and styleUrls with the compressed content.
