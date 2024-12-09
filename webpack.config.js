const path = require("path");
const HTMLPlugin = require("html-webpack-plugin");
const CopyPlugin = require("copy-webpack-plugin")
const tailwindcss = require('tailwindcss')
const autoprefixer = require('autoprefixer')


module.exports = {
    entry: {
        index: "./src/index.tsx"
    },
    mode: "production",
    module: {
        rules: [
            {
              test: /\.tsx?$/,
               use: [
                 {
                  loader: "ts-loader",
                   options: {
                    transpileOnly: false,
                    }
                  }],
               exclude: /node_modules/,
            },
            {
              exclude: /node_modules/,
              test: /\.css$/i,
               use: [
                  "style-loader",
                  "css-loader",
                  {
                    loader: 'postcss-loader', // postcss loader needed for tailwindcss
                    options: {
                        postcssOptions: {
                            ident: 'postcss',
                            plugins: [tailwindcss, autoprefixer],
                        },
                    },
                  }
               ]
            },
            {
                test: /\.svg$/,
                use: ["@svgr/webpack"],
            },
        ],
    },
    plugins: [
        new CopyPlugin({
            patterns: [
                { from: "manifest.json", to: "../manifest.json" },
                {
                    from: path.resolve('./src/assets'),
                    to:  path.resolve('dist/assets')
                },
                {
                    from: path.resolve('./src/logo'),
                    to:  path.resolve('dist/logo')
                },
                {
                    from: path.resolve('background/index.js'),
                    to: path.resolve('dist')
                },
                {
                    from: path.resolve('contentScript.js'),
                    to: path.resolve('dist')
                }
            ],
        }),
        ...getHtmlPlugins(["index"]),
    ],
    resolve: {
        extensions: [".tsx", ".ts", ".js", ".jsx"],
    },
    output: {
        path: path.join(__dirname, "dist/js"),
        filename: "[name].js",
    },
};

function getHtmlPlugins(chunks) {
    return chunks.map(
        (chunk) =>
            new HTMLPlugin({
                title: "Kleo Network",
                filename: `${chunk}.html`,
                chunks: [chunk],
            })
    );
}