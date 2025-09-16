#!/bin/bash

echo "🛠️ ADVANCED Fix for RCT-Folly C++20 compatibility issues 🛠️"

# Add our template specialization code
PATCH_CODE='
// C++20 compatibility fix for Xcode 16
#if __cplusplus > 201703L
#include <streambuf>
namespace std {
template<> struct char_traits<unsigned char> {
  using char_type = unsigned char;
  using int_type = int;
  using off_type = streamoff;
  using pos_type = streampos;
  using state_type = mbstate_t;
  static void assign(char_type& c1, const char_type& c2) noexcept { c1 = c2; }
  static bool eq(const char_type& c1, const char_type& c2) noexcept { return c1 == c2; }
  static bool lt(const char_type& c1, const char_type& c2) noexcept { return c1 < c2; }
  static int compare(const char_type* s1, const char_type* s2, size_t n) { return memcmp(s1, s2, n); }
  static size_t length(const char_type* s) { return strlen(reinterpret_cast<const char*>(s)); }
  static const char_type* find(const char_type* s, size_t n, const char_type& a) { return static_cast<const char_type*>(memchr(s, a, n)); }
  static char_type* move(char_type* s1, const char_type* s2, size_t n) { return static_cast<char_type*>(memmove(s1, s2, n)); }
  static char_type* copy(char_type* s1, const char_type* s2, size_t n) { return static_cast<char_type*>(memcpy(s1, s2, n)); }
  static char_type* assign(char_type* s, size_t n, char_type a) { return static_cast<char_type*>(memset(s, a, n)); }
  static int_type not_eof(int_type c) noexcept { return c != EOF ? c : 0; }
  static char_type to_char_type(int_type c) noexcept { return static_cast<char_type>(c); }
  static int_type to_int_type(char_type c) noexcept { return static_cast<int_type>(c); }
  static bool eq_int_type(int_type c1, int_type c2) noexcept { return c1 == c2; }
  static int_type eof() noexcept { return EOF; }
};
}
#endif
'

# Function to patch a file by adding our patch to the top
patch_file() {
  FILE="$1"
  echo "📂 Searching for: $FILE"

  # Wait up to 20 seconds for file to exist
  RETRIES=20
  until [ -f "$FILE" ] || [ $RETRIES -eq 0 ]; do
    echo "⏳ Waiting for $FILE to exist... ($RETRIES attempts left)"
    sleep 1
    RETRIES=$((RETRIES - 1))
  done

  if [ ! -f "$FILE" ]; then
    echo "❌ File not found: $FILE"
    return
  fi

  echo "✅ Found $FILE"

  # Check if already patched
  if grep -q "char_traits<unsigned char>" "$FILE"; then
    echo "✅ File already patched: $FILE"
    # Show a few lines to confirm
    echo "📄 First 10 lines of $FILE:"
    head -n 10 "$FILE" | grep -A 5 char_traits || true
    return
  fi

  # Create backup
  cp "$FILE" "$FILE.backup"
  echo "✅ Created backup: $FILE.backup"

  # Apply patch at the top
  echo "$PATCH_CODE" > "$FILE.tmp"
  cat "$FILE" >> "$FILE.tmp"
  mv "$FILE.tmp" "$FILE"
  echo "✅ Patched file: $FILE"

  # Verify patch was applied
  if grep -q "char_traits<unsigned char>" "$FILE"; then
    echo "✅ Verified patch in: $FILE"
    # Show the patched section
    echo "📄 First 10 lines of patched $FILE:"
    head -n 10 "$FILE"
  else
    echo "❌ Failed to verify patch in: $FILE"
    echo "📄 First 10 lines of $FILE (should have contained the patch):"
    head -n 10 "$FILE"
  fi
}

# Add compiler flags to xcconfig files
patch_xcconfig() {
  for CONFIG_FILE in "$1"*.xcconfig; do
    if [ -f "$CONFIG_FILE" ]; then
      echo "🔧 Found xcconfig: $CONFIG_FILE"
      
      if ! grep -q "OTHER_CPLUSPLUSFLAGS.*_LIBCPP_DISABLE_AVAILABILITY" "$CONFIG_FILE"; then
        echo 'OTHER_CPLUSPLUSFLAGS = $(inherited) -D_LIBCPP_DISABLE_AVAILABILITY=1 -std=c++17' >> "$CONFIG_FILE"
        echo "✅ Added compiler flags to: $CONFIG_FILE"
        echo "📄 Tail of $CONFIG_FILE:"
        tail -n 5 "$CONFIG_FILE"
      else
        echo "✅ Compiler flags already in: $CONFIG_FILE"
        echo "📄 Existing flags in $CONFIG_FILE:"
        grep "OTHER_CPLUSPLUSFLAGS" "$CONFIG_FILE"
      fi
    fi
  done
}

# Function to wait for pods installation to complete
wait_for_pods() {
  echo "Waiting for Pods directory to be created..."
  RETRIES=30
  until [ -d "./ios/Pods" ] || [ $RETRIES -eq 0 ]; do
    echo "⏳ Waiting for ./ios/Pods directory to exist... ($RETRIES attempts left)"
    sleep 2
    RETRIES=$((RETRIES - 1))
  done

  if [ ! -d "./ios/Pods" ]; then
    echo "❌ Pods directory not found, trying to run pod install"
    cd ios && pod install && cd ..
  else
    echo "✅ Pods directory found"
  fi
}

# APPROACH 1: Patch directly if files already exist
echo "APPROACH 1: Trying direct patch of files..."
wait_for_pods

# Try to patch files directly
patch_file "./ios/Pods/RCT-Folly/folly/json_pointer.cpp"
patch_file "./ios/Pods/RCT-Folly/folly/Unicode.cpp"

# Try to patch xcconfig files
patch_xcconfig "./ios/Pods/Target Support Files/RCT-Folly/RCT-Folly"

# APPROACH 2: Modify Podfile to add compiler flags
echo "APPROACH 2: Updating Podfile to add compiler flags..."
PODFILE="./ios/Podfile"
if [ -f "$PODFILE" ]; then
  # Backup Podfile
  cp "$PODFILE" "$PODFILE.backup"
  
  # Add compiler flags to RCT-Folly in post_install
  if ! grep -q "OTHER_CPLUSPLUSFLAGS.*_LIBCPP_DISABLE_AVAILABILITY.*RCT-Folly" "$PODFILE"; then
    awk '
    /post_install do \|installer\|/ {
      print;
      print "    # *** AUTO-ADDED FIX for RCT-Folly C++20 compatibility ***";
      print "    installer.pods_project.targets.each do |target|";
      print "      if target.name == \"RCT-Folly\"";
      print "        target.build_configurations.each do |config|";
      print "          config.build_settings[\"OTHER_CPLUSPLUSFLAGS\"] = \"$(inherited) -D_LIBCPP_DISABLE_AVAILABILITY=1 -std=c++17\"";
      print "          puts \"✅ Applied compiler flags to RCT-Folly in Podfile\"";
      print "        end";
      print "      end";
      print "    end";
      next;
    }
    { print }
    ' "$PODFILE" > "$PODFILE.new" && mv "$PODFILE.new" "$PODFILE"
    
    echo "✅ Updated Podfile with compiler flags"
    echo "📄 Updated portion of Podfile:"
    grep -A 10 "post_install do |installer|" "$PODFILE"
  else
    echo "✅ Podfile already has compiler flags"
    echo "📄 Existing flags in Podfile:"
    grep -A 10 "OTHER_CPLUSPLUSFLAGS.*_LIBCPP_DISABLE_AVAILABILITY" "$PODFILE"
  fi
fi

# APPROACH 3: Create patch header and add to system
echo "APPROACH 3: Creating universal header patch..."
PATCH_HEADER="./ios/RCTFollyPatch.h"

# Create header patch
cat > "$PATCH_HEADER" << 'EOF'
// RCT-Folly patch for Xcode 16 / C++20
#pragma once

#if __cplusplus > 201703L
#include <streambuf>
namespace std {
template<> struct char_traits<unsigned char> {
  using char_type = unsigned char;
  using int_type = int;
  using off_type = streamoff;
  using pos_type = streampos;
  using state_type = mbstate_t;
  static void assign(char_type& c1, const char_type& c2) noexcept { c1 = c2; }
  static bool eq(const char_type& c1, const char_type& c2) noexcept { return c1 == c2; }
  static bool lt(const char_type& c1, const char_type& c2) noexcept { return c1 < c2; }
  static int compare(const char_type* s1, const char_type* s2, size_t n) { return memcmp(s1, s2, n); }
  static size_t length(const char_type* s) { return strlen(reinterpret_cast<const char*>(s)); }
  static const char_type* find(const char_type* s, size_t n, const char_type& a) { return static_cast<const char_type*>(memchr(s, a, n)); }
  static char_type* move(char_type* s1, const char_type* s2, size_t n) { return static_cast<char_type*>(memmove(s1, s2, n)); }
  static char_type* copy(char_type* s1, const char_type* s2, size_t n) { return static_cast<char_type*>(memcpy(s1, s2, n)); }
  static char_type* assign(char_type* s, size_t n, char_type a) { return static_cast<char_type*>(memset(s, a, n)); }
  static int_type not_eof(int_type c) noexcept { return c != EOF ? c : 0; }
  static char_type to_char_type(int_type c) noexcept { return static_cast<char_type>(c); }
  static int_type to_int_type(char_type c) noexcept { return static_cast<int_type>(c); }
  static bool eq_int_type(int_type c1, int_type c2) noexcept { return c1 == c2; }
  static int_type eof() noexcept { return EOF; }
};
}
#endif
EOF

echo "✅ Created patch header at $PATCH_HEADER"
echo "📄 Contents of patch header:"
cat "$PATCH_HEADER"

# APPROACH 4: Try to add the header to prefix header in Pods project (last resort)
echo "APPROACH 4: Adding our patch to prefix header (advanced/brittle approach)..."
PODS_PROJECT="./ios/Pods/Pods.xcodeproj/project.pbxproj"

if [ -f "$PODS_PROJECT" ]; then
  echo "⚠️ Note: This approach is brittle and may not work in all environments"
  cp "$PODS_PROJECT" "$PODS_PROJECT.backup"
  
  # Try to add our patch header to the RCT-Folly target, carefully escaping $(inherited)
  sed -i.bak "s|\(buildSettings = {.*\)\(name = \"RCT-Folly\";\)|\1\2\n\t\t\t\tGCC_PREFIX_HEADER = \"$PATCH_HEADER\";\n\t\t\t\tOTHER_CPLUSPLUSFLAGS = \"\\\$(inherited) -D_LIBCPP_DISABLE_AVAILABILITY=1 -std=c++17\";|" "$PODS_PROJECT"
  
  # Check if the sed command actually changed anything
  if grep -q "GCC_PREFIX_HEADER.*RCTFollyPatch" "$PODS_PROJECT"; then
    echo "✅ Successfully added prefix header to Pods project"
    echo "📄 Modified section in Pods project:"
    grep -A 3 "GCC_PREFIX_HEADER.*RCTFollyPatch" "$PODS_PROJECT"
  else
    echo "⚠️ Could not verify prefix header was added to Pods project"
    echo "    This is expected in some environments and other approaches should still work"
  fi
else
  echo "⚠️ Pods project file not found, skipping project modification"
fi

echo "🎉 All RCT-Folly patches applied using multiple approaches"
echo "One or more of these approaches should fix the build issues"
echo "==== ENVIRONMENT INFO ===="
echo "Current directory: $(pwd)"
echo "Podfile exists: $([ -f "./ios/Podfile" ] && echo "Yes" || echo "No")"
echo "RCT-Folly files exist: $([ -f "./ios/Pods/RCT-Folly/folly/json_pointer.cpp" ] && echo "Yes" || echo "No")" 