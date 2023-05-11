const path = require("path");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

module.exports = {
  // Entry -> 우리가 편경하고자 하는 파일
  entry: "./src/client/js/main.js",
  plugins: [
    new MiniCssExtractPlugin({
      filename: "css/styles.css",
    }),
  ],
  //production , development 모드가 있다는걸 기억. production모드는 코드를 이해할 수
  //없는 이상한 코드로 압축시켜버린다. 개발할 때면 development 모드설정 필요.
  mode: "development",
  //css같은 내용물들이 변경될 때 마다 console에 그걸 띄울꺼냐 말꺼냐를 결정하는 것. 에러나면 걍 없애버려.
  watch: true,
  output: {
    filename: "js/main.js",
    //__dirname -> 자바스크립트 상수. 현재 디렉토리를 절대경로로 알려줌.
    // **절대경로** 특정 경로의 풀 경로를 얘기함.
    // resolve 인자 ->  __dirname 뒤에 /assets로 붙고, /js 도 붙는다는 의미.
    path: path.resolve(__dirname, "assets"),
    clean: true,
  },
  module: {
    //이 아래에 하는짓이 뭐나면, javascript코드를 babel-loader라는 loader로 가공하는것. rules로 시작한다.
    rules: [
      {
        // javascript 파일들을 변형시키겟다는 선언
        test: /\.js$/,
        use: {
          //"babel-loader"를 사용해서 js 파일들을 처리하겟다고 Loader 선언.
          loader: "babel-loader",
          //babel-loader에게  전달할 옵션들
          options: {
            presets: [["@babel/preset-env", { targets: "defaults" }]],
          },
        },
      },
      {
        test: /\.scss$/,
        use: [MiniCssExtractPlugin.loader, "css-loader", "sass-loader"],
      },
    ],
  },
};
