This web application for readsb is written in Typescript v3.6+.
Do not edit the .js files directly but Typescript .ts files instead.

The core web application has no dependency on JQuery. However, the used bootstrap library
is still depending on Jquery until removed completely (work in progress).

Visual Studio Code (VSC) is used as development IDE with the following extensions enabled:

* GitLens
* JS Refactor
* npm
* npm Intellisense
* Prettier
* TSLint
* Todo Tree

### Package dependencies
* nodeJS
* npm
* TSC compiler

### Typings
* leaflet.extend.d.ts contains all type definitions that are used in this web application to extend Leaflet.
* typedefs.d.ts contains all web application internal type definitions.

### Setup development evironment
1) Get a repository copy: `git clone https://github.com/Mictronics/readsb.git`
2) In VSC workspace add this folder "webapp"
3) Build application manually in VSC `npm run build` in terminal
4) Or auto build on changes use VSC > Terminal > Run Task `tsc: build - tsconfig.json`

### Debugging code in browser
TSC will generate automatically .map files so you can debug the Typescript .ts files directly in browsers
developmer tools.
