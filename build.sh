#!/bin/bash

BUILD_DIR="./dist"

echo "--- Start Next.js build script ---"

echo "正在清理现有构建目录: $BUILD_DIR"
if [ -d "$BUILD_DIR" ]; then
    rm -rf "$BUILD_DIR"
    if [ $? -ne 0 ]; then
        echo "错误: 无法删除现有目录 '$BUILD_DIR'。请检查权限或目录状态"
        exit 1
    fi
fi

echo "正在使用 pnpm 安装项目依赖..."
pnpm install
if [ $? -ne 0 ]; then
    echo "错误: pnpm install 失败。请检查您的依赖配置或网络连接"
    exit 1
fi

# --- 3. 构建 Next.js 应用程序 ---
echo "正在构建 Next.js 应用程序 (输出模式: standalone)..."
pnpm run build
if [ $? -ne 0 ]; then
    echo "错误: pnpm run build 失败。请检查您的构建配置或代码错误"
    exit 1
fi

# --- 4. 创建最终分发目录 ---
echo "正在创建最终分发目录: $BUILD_DIR"
mkdir -p "$BUILD_DIR"
if [ $? -ne 0 ]; then
    echo "错误: 无法创建目录 '$BUILD_DIR'。请检查权限"
    exit 1
fi

# --- 5. 复制 Next.js standalone 构建产物 ---
echo "正在将 standalone 构建输出复制到 $BUILD_DIR..."
cp -r ./.next/standalone/. "$BUILD_DIR"/
if [ $? -ne 0 ]; then
    echo "错误: 复制 .next/standalone 内容失败"
    exit 1
fi

# --- 6. 复制公共资产 ---
echo "正在复制公共资产 (public 目录)..."
cp -r ./public "$BUILD_DIR"/public
if [ $? -ne 0 ]; then
    echo "错误: 复制公共资产失败"
    exit 1
fi

# --- 7. 复制静态资产 ---
echo "正在复制静态资产 (.next/static)..."
mkdir -p "$BUILD_DIR"/.next
cp -r ./.next/static "$BUILD_DIR"/.next/static
if [ $? -ne 0 ]; then
    echo "错误: 复制 .next/static 失败"
    exit 1
fi

echo "正在使用 pnpm 安装项目依赖..."
cd $BUILD_DIR && pnpm install
if [ $? -ne 0 ]; then
    echo "错误: pnpm install 失败。请检查您的依赖配置或网络连接"
    exit 1
fi

cd ..
echo "正在构建压缩包..."
tar -zcf dist.tar.gz dist
if [ $? -ne 0 ]; then
    echo "错误: 创建压缩包失败"
    exit 1
fi

echo "--- 构建和打包已成功完成！ ---"
echo "您的生产就绪应用程序位于: $BUILD_DIR"
echo "要运行应用程序，请导航到该目录并执行以下命令:"
echo "node server.js"
