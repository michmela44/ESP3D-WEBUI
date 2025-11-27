const path = require("path")
const MiniCssExtractPlugin = require("mini-css-extract-plugin")
const { CleanWebpackPlugin } = require("clean-webpack-plugin")
const HtmlWebpackPlugin = require("html-webpack-plugin")
const HtmlMinimizerPlugin = require("html-minimizer-webpack-plugin")
const HtmlInlineScriptPlugin = require("html-inline-script-webpack-plugin")
const HTMLInlineCSSWebpackPlugin =
    require("html-inline-css-webpack-plugin").default
const Compression = require("compression-webpack-plugin")
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin
const TerserPlugin = require("terser-webpack-plugin")

module.exports = {
    resolve: {
        extensions: [".js", ".jsx", ".ts", ".tsx"],
    },
    mode: "production", // this trigger webpack out-of-box prod optimizations
    entry: path.resolve(__dirname, "../src/index.js"),
    output: {
        filename: `[name].[hash].js`, // [hash] is useful for cache busting!
        path: path.resolve(__dirname, "../dist"),
    },
    module: {
        rules: [
            {
                test: /\.(sa|sc|c)ss$/,
                use: [
                    { loader: MiniCssExtractPlugin.loader },
                    {
                        loader: "css-loader",
                        options: {
                            sourceMap: false,
                        },
                    },
                    {
                        loader: "sass-loader",
                        options: {
                            sourceMap: false,
                        },
                    },
                ],
            },
            {
                test: /\.(js|jsx)$/,
                exclude: /node_modules/,
                use: [
                    {
                        loader: "babel-loader",
                        options: {
                            presets: ["preact"],
                        },
                    },
                ],
            },
            {
                test: /\.(ts|tsx)$/,
                exclude: /node_modules/,
                use: [
                    {
                        loader: "ts-loader",
                        options: {
                            transpileOnly: false,
                            configFile: path.resolve(__dirname, "../tsconfig.json"),
                            logLevel: "info"
                        }
                    },
                ],
            },
        ],
    },
    plugins: [
        // always deletes the dist folder first in each build run.
        new CleanWebpackPlugin(),
        new MiniCssExtractPlugin({
            filename: "[name].css",
            chunkFilename: "[id].css",
        }),
        new HtmlWebpackPlugin({
            template: path.join(__dirname, "../src/index.html"),
            inlineSource: ".(js|css)$",
            inject: "body",
        }),

        new HtmlInlineScriptPlugin({
            scriptMatchPattern: [/.+[.]js$/],
            htmlMatchPattern: [/index.html$/],
        }),
        new HTMLInlineCSSWebpackPlugin(),
        new Compression({
            test: /\.(html)$/,
            filename: "[path][base].gz",
            algorithm: "gzip",
            exclude: /.map$/,
            deleteOriginalAssets: "keep-source-map",
        }),
        new BundleAnalyzerPlugin({
            analyzerMode: 'static',
            openAnalyzer: false,
            reportFilename: path.resolve(__dirname, `../bundle-report-CNC-FluidNC.html`),
            generateStatsFile: true,
            statsFilename: path.resolve(__dirname, `../bundle-stats-CNC-FluidNC.json`),
        }),
    ],
    optimization: {
        minimize: true,
        minimizer: [
            new TerserPlugin({
                terserOptions: {
                    compress: {
                        drop_console: true,
                        drop_debugger: true,
                        pure_funcs: ['console.log', 'console.info'],
                        passes: 2,
                    },
                    mangle: true,
                    output: {
                        comments: false,
                    },
                },
                extractComments: false,
            }),
            new HtmlMinimizerPlugin({
                minimizerOptions: {
                    collapseWhitespace: true,
                    minifyCSS: true,
                    minifyJS: true,
                },
                minify: (data, minimizerOptions) => {
                    const htmlMinifier = require("html-minifier-terser")
                    const [[filename, input]] = Object.entries(data)
                    return htmlMinifier.minify(input, minimizerOptions)
                },
            }),
        ],
    },
    devtool: false, // supposedly the ideal type without bloating bundle size
    stats: "normal", // show warnings and deprecation notices
}
