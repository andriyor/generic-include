## generic-include

Include for any types of files

## Install

```shell
npm i ginclude
```

## Usage

```shell
ginclude --files-glob='src/**/*.txt'
```

`main.txt`
```txt
Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
#include "./next.txt"
```

`next.txt`
```text
Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
```

generic-include will produce such output

`main.build.txt`
```text
Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
```
