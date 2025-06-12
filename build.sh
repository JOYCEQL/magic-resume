#!/bin/bash

BUILD_DIR="./dist"

echo "--- Start Next.js build script ---"

echo "Clean existing build directory: $BUILD_DIR"
if [ -d "$BUILD_DIR" ]; then
    rm -rf "$BUILD_DIR"
    if [ $? -ne 0 ]; then
        echo "Error: Cannot delete directory '$BUILD_DIR'. Please check directory permission."
        exit 1
    fi
fi

echo "Using pnpm to install project dependencies..."
pnpm install
if [ $? -ne 0 ]; then
    echo "Error: pnpm install failed."
    exit 1
fi

echo "Building Next.js Application (Mode: standalone)..."
pnpm run build
if [ $? -ne 0 ]; then
    echo "Error: pnpm run build failed."
    exit 1
fi

echo "Creating final distribution directory: $BUILD_DIR"
mkdir -p "$BUILD_DIR"
if [ $? -ne 0 ]; then
    echo "Error: Cannot create directory '$BUILD_DIR'. Please check directory permission."
    exit 1
fi

echo "Copying standalone to distribution directory $BUILD_DIR..."
cp -r ./.next/standalone/. "$BUILD_DIR"/
if [ $? -ne 0 ]; then
    echo "Error: Copy .next/standalone failed."
    exit 1
fi

echo "Copying public assets..."
cp -r ./public "$BUILD_DIR"/public
if [ $? -ne 0 ]; then
    echo "Error: Copy public assets failed."
    exit 1
fi

echo "Copying static assets (.next/static)..."
mkdir -p "$BUILD_DIR"/.next
cp -r ./.next/static "$BUILD_DIR"/.next/static
if [ $? -ne 0 ]; then
    echo "Error: Copy .next/static failed."
    exit 1
fi

echo "Using pnpm to install project dependencies..."
cd $BUILD_DIR && pnpm install
if [ $? -ne 0 ]; then
    echo "Error: pnpm install failed."
    exit 1
fi

cd ..
echo "Building tar.gz file..."
tar -zcf dist.tar.gz dist
if [ $? -ne 0 ]; then
    echo "Error: tar.gz file creation failed."
    exit 1
fi

echo "--- Build complete ---"
echo "Build directory: $BUILD_DIR"
echo "If you want to run the application, please run the following command:"
echo "node server.js"
