#!/bin/bash

echo "🛠️ Applying RCT-Folly patches for Xcode 16 compatibility 🛠️"

# Check if the RCT-Folly directory exists
if [ ! -d "./ios/Pods/RCT-Folly" ]; then
    echo "❌ RCT-Folly not found, skipping patch"
    exit 0
fi

# Target file to patch
TARGET_FILE="./ios/Pods/RCT-Folly/folly/json_pointer.cpp"

# Check if the target file exists
if [ ! -f "$TARGET_FILE" ]; then
    echo "❌ Target file $TARGET_FILE not found, skipping patch"
    exit 0
fi

echo "✅ Found $TARGET_FILE, applying patch..."

# Create a backup
cp "$TARGET_FILE" "$TARGET_FILE.backup"

# Copy our pre-created fixed file
if [ -f "./ios/json_pointer.cpp.fixed" ]; then
    cp "./ios/json_pointer.cpp.fixed" "$TARGET_FILE"
    echo "✅ Replaced $TARGET_FILE with fixed version"
else
    echo "❌ Fixed json_pointer.cpp not found, skipping replacement"
fi

# Update json_pointer.h to include our patches
JSON_POINTER_H="./ios/Pods/RCT-Folly/folly/json_pointer.h"
if [ -f "$JSON_POINTER_H" ] && [ -f "./ios/fixed_char_traits.h" ]; then
    echo "Patching $JSON_POINTER_H to include our fixes..."
    # Create a backup
    cp "$JSON_POINTER_H" "$JSON_POINTER_H.backup"
    # Create patches directory
    mkdir -p "./ios/Pods/RCT-Folly/folly/patches"
    # Copy our fixed_char_traits.h to patches directory
    cp "./ios/fixed_char_traits.h" "./ios/Pods/RCT-Folly/folly/patches/fixed_char_traits.h"
    # Add include at the top of json_pointer.h
    sed -i.bak '1s/^/#include <folly\/patches\/fixed_char_traits.h>\n/' "$JSON_POINTER_H"
    echo "✅ Successfully patched $JSON_POINTER_H"
fi

# Apply compiler flags by modifying the xcconfig files
FOLLY_XCCONFIG="./ios/Pods/Target Support Files/RCT-Folly/RCT-Folly.release.xcconfig"
if [ -f "$FOLLY_XCCONFIG" ] && [ -f "./ios/folly-patch.xcconfig" ]; then
    echo "Patching $FOLLY_XCCONFIG..."
    # Append our flags
    cat "./ios/folly-patch.xcconfig" >> "$FOLLY_XCCONFIG"
    echo "✅ Successfully patched $FOLLY_XCCONFIG"
fi

FOLLY_DEBUG_XCCONFIG="./ios/Pods/Target Support Files/RCT-Folly/RCT-Folly.debug.xcconfig"
if [ -f "$FOLLY_DEBUG_XCCONFIG" ] && [ -f "./ios/folly-patch.xcconfig" ]; then
    echo "Patching $FOLLY_DEBUG_XCCONFIG..."
    # Append our flags
    cat "./ios/folly-patch.xcconfig" >> "$FOLLY_DEBUG_XCCONFIG"
    echo "✅ Successfully patched $FOLLY_DEBUG_XCCONFIG"
fi

echo "🎉 All Folly patches applied successfully" 