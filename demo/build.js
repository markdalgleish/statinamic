import path from "path"
import webpack from "webpack"
import ExtractTextPlugin from "extract-text-webpack-plugin"

import markdownIt from "markdown-it"
import markdownItTocAndAnchor from "markdown-it-toc-and-anchor"
import hljs from "highlight.js"

import pkg from "./package.json"

import builder from "statinamic/lib/builder"
import configurator from "statinamic/lib/configurator"

const config = configurator(pkg)

const sourceBase = "content"
const destBase = "dist"
const root = path.join(__dirname)
const source = path.join(root, sourceBase)
const dest = path.join(root, destBase)

const webpackConfig = {
  output: {
    path: dest,
    filename: "[name].js",
    publicPath: "/",
  },

  resolve: {
    extensions: [
      // node default extensions
      ".js",
      ".json",
      // for all other extensions specified directly
      "",
    ],

    root: [
      path.join(__dirname, "node_modules"),
      // should be this in real world
      // path.join(__dirname, "node_modules", "statinamic", "node_modules"),
      path.join(__dirname, "web_modules", "statinamic", "node_modules"),
    ],
  },

  resolveLoader: {
    root: [
      path.join(__dirname, "node_modules"),
      path.join(__dirname, "web_modules"),
    ],
  },

  module: {
    // ! \\ note that loaders are executed from bottom to top !
    loaders: [
      //
      // statinamic requirement
      //
      {
        test: /\.md$/,
        loader: "statinamic/lib/markdown-as-json-loader" +
          `?context=${ source }&basepath=${ config.baseUrl.path }`,
      },
      {
        test: /\.json$/,
        loader: "json-loader",
      },

      // your loaders
      {
        test: /\.js$/,
        loaders: [
          "babel-loader" + (
            !config.dev ? "" : (
              "?" + JSON.stringify({
                plugins: [
                  "react-transform",
                ],
                extra: {
                  "react-transform": [
                    // enable react hot loading
                    {
                      target: "react-transform-webpack-hmr",
                      imports: [ "react" ],
                      locals: [ "module" ],
                    },
                    // show errors on screen
                    {
                      target: "react-transform-catch-errors",
                      imports: [ "react", "redbox-react" ],
                    },
                  ],
                },
              })
            )
          ),
          ...config.dev && [ "eslint-loader" ],
        ],
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        loader: ExtractTextPlugin.extract(
          "style-loader",
          "css-loader" +
            "?localIdentName=[path][name]--[local]--[hash:base64:5]" +
            "&modules"+
          "!postcss-loader"
        ),
      },
    ],
  },

  postcss: () => [
    require("postcss-custom-properties"),
    require("postcss-custom-media"),
    require("autoprefixer"),
  ],

  plugins: [
    new webpack.DefinePlugin(
      // transform string as "string" so hardcoded replacements are
      // syntaxically correct
      Object.keys(config.consts).reduce((obj, constName) => {
        const value = config.consts[constName]
        return {
          ...obj,
          [constName]: (
            typeof value === "string" ? JSON.stringify(value) : value
          ),
        }
      }, {})
    ),
  ],

  node: {
    // https://github.com/webpack/webpack/issues/451
    // run tape test with webpack
    fs: "empty",
  },

  markdownIt: (
    markdownIt({
      html: true,
      linkify: true,
      typographer: true,
      highlight: (code, lang) => {
        code = code.trim()
        // language is recognized by highlight.js
        if (lang && hljs.getLanguage(lang)) {
          return hljs.highlight(lang, code).value
        }
        // ...or fallback to auto
        return hljs.highlightAuto(code).value
      },
    })
      .use(markdownItTocAndAnchor, {
        tocFirstLevel: 2,
      })
  ),
}

builder({
  config,
  source,
  dest,

  clientWebpackConfig: {
    ...webpackConfig,

    entry: {
      "statinamic-client": path.join(__dirname, "index-client"),
    },

    plugins: [
      ...webpackConfig.plugins,

      // ! \\ the static build below will extract the exact same thing in the
      // same file, but here we use extract plugin to REMOVE REDUNDANT CSS
      // from the build. Since there is a static build that is used for the
      // first viewed page (which contains all css), we don't need styles in
      // the JS too.
      new ExtractTextPlugin(
        "[name].css",
        { disable: config.dev }
      ),

      ...config.prod && [
        new webpack.optimize.DedupePlugin(),
        new webpack.optimize.UglifyJsPlugin({
          compress: {
            warnings: false,
          },
        }),
      ],
    ],
  },
  staticWebpackConfig: {
    ...webpackConfig,

    entry: {
      "statinamic-static": path.join(__dirname, "index-static"),
    },

    target: "node",

    output: {
      libraryTarget: "commonjs2",
      path: path.join(dest, ".."),
      filename: "[name].js",
      publicPath: "/",
    },

    plugins: [
      ...webpackConfig.plugins,

      // extract (and overwrite) statinamic client css
      new ExtractTextPlugin(destBase + "/statinamic-client.css"),
    ],
  },
})
