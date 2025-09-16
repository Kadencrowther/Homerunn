#!/bin/bash

echo "🛠️ Fix script for RCT-Folly and Xcode 16 compatibility 🛠️"

# First, create a header file that will be included in any Folly C++ file
mkdir -p ./ios
cat > ./ios/fixed_char_traits.h << 'EOL'
#pragma once

#if __cplusplus > 201703L
#include <string>
namespace std {
  // If this specialization already exists, this will be ignored
  template<>
  struct char_traits<unsigned char> {
    using char_type = unsigned char;
    using int_type = int;
    using off_type = streamoff;
    using pos_type = streampos;
    using state_type = mbstate_t;
    
    static void assign(char_type& c1, const char_type& c2) noexcept {
      c1 = c2;
    }
    
    static bool eq(const char_type& c1, const char_type& c2) noexcept {
      return c1 == c2;
    }
    
    static bool lt(const char_type& c1, const char_type& c2) noexcept {
      return c1 < c2;
    }
    
    static int compare(const char_type* s1, const char_type* s2, size_t n) {
      return memcmp(s1, s2, n);
    }
    
    static size_t length(const char_type* s) {
      return strlen(reinterpret_cast<const char*>(s));
    }
    
    static const char_type* find(const char_type* s, size_t n, const char_type& a) {
      return static_cast<const char_type*>(memchr(s, a, n));
    }
    
    static char_type* move(char_type* s1, const char_type* s2, size_t n) {
      return static_cast<char_type*>(memmove(s1, s2, n));
    }
    
    static char_type* copy(char_type* s1, const char_type* s2, size_t n) {
      return static_cast<char_type*>(memcpy(s1, s2, n));
    }
    
    static char_type* assign(char_type* s, size_t n, char_type a) {
      return static_cast<char_type*>(memset(s, a, n));
    }
    
    static int_type not_eof(int_type c) noexcept {
      return c != EOF ? c : 0;
    }
    
    static char_type to_char_type(int_type c) noexcept {
      return static_cast<char_type>(c);
    }
    
    static int_type to_int_type(char_type c) noexcept {
      return static_cast<int_type>(c);
    }
    
    static bool eq_int_type(int_type c1, int_type c2) noexcept {
      return c1 == c2;
    }
    
    static int_type eof() noexcept {
      return EOF;
    }
  };
}
#endif
EOL

echo "✅ Created fixed_char_traits.h file in ios directory"

# Wait for Pods directory to be created during prebuild
echo "Waiting for pod install to complete..."
sleep 10

# Create a file that will be used to patch the XCConfig files
cat > ./ios/folly-patch.xcconfig << 'EOL'
OTHER_CPLUSPLUSFLAGS = $(inherited) -D_LIBCPP_DISABLE_AVAILABILITY=1 -std=c++17
GCC_PREPROCESSOR_DEFINITIONS = $(inherited) FOLLY_MOBILE=1 FOLLY_NO_CONFIG=1 FOLLY_HAVE_LIBGFLAGS=0 FOLLY_HAVE_LIBJEMALLOC=0 FOLLY_USE_LIBCPP=1 FOLLY_CFG_NO_COROUTINES=1
EOL

echo "✅ Created folly-patch.xcconfig file in ios directory"

# Create a precompiled header file
cat > ./ios/folly-fix.pch << 'EOL'
#ifndef FOLLY_FIX_PCH
#define FOLLY_FIX_PCH

#include "../fixed_char_traits.h"

#endif /* FOLLY_FIX_PCH */
EOL

echo "✅ Created folly-fix.pch file in ios directory"

# Write out the entire fixed json_pointer.cpp file
cat > ./ios/json_pointer.cpp.fixed << 'EOL'
/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

#include <folly/json_pointer.h>

#if __cplusplus > 201703L
namespace std {
  template<>
  struct char_traits<unsigned char> {
    using char_type = unsigned char;
    using int_type = int;
    using off_type = streamoff;
    using pos_type = streampos;
    using state_type = mbstate_t;
    
    static void assign(char_type& c1, const char_type& c2) noexcept {
      c1 = c2;
    }
    
    static bool eq(const char_type& c1, const char_type& c2) noexcept {
      return c1 == c2;
    }
    
    static bool lt(const char_type& c1, const char_type& c2) noexcept {
      return c1 < c2;
    }
    
    static int compare(const char_type* s1, const char_type* s2, size_t n) {
      return memcmp(s1, s2, n);
    }
    
    static size_t length(const char_type* s) {
      return strlen(reinterpret_cast<const char*>(s));
    }
    
    static const char_type* find(const char_type* s, size_t n, const char_type& a) {
      return static_cast<const char_type*>(memchr(s, a, n));
    }
    
    static char_type* move(char_type* s1, const char_type* s2, size_t n) {
      return static_cast<char_type*>(memmove(s1, s2, n));
    }
    
    static char_type* copy(char_type* s1, const char_type* s2, size_t n) {
      return static_cast<char_type*>(memcpy(s1, s2, n));
    }
    
    static char_type* assign(char_type* s, size_t n, char_type a) {
      return static_cast<char_type*>(memset(s, a, n));
    }
    
    static int_type not_eof(int_type c) noexcept {
      return c != EOF ? c : 0;
    }
    
    static char_type to_char_type(int_type c) noexcept {
      return static_cast<char_type>(c);
    }
    
    static int_type to_int_type(char_type c) noexcept {
      return static_cast<int_type>(c);
    }
    
    static bool eq_int_type(int_type c1, int_type c2) noexcept {
      return c1 == c2;
    }
    
    static int_type eof() noexcept {
      return EOF;
    }
  };
}
#endif

namespace folly {

JSONPointer::JSONPointer(StringPiece jsonPtr) {
  auto process = [&]() {
    for (auto first = jsonPtr.begin(), last = jsonPtr.end(); first != last;) {
      auto second = std::find(first, last, '/');
      if (first != jsonPtr.begin()) {
        pushToken(StringPiece(first, second));
      }
      first = second != last ? second + 1 : last;
    }
  };

  if (jsonPtr.empty()) {
    return;
  }

  if (jsonPtr[0] != '/') {
    throw JSONPointerException("If non-empty, JSON pointer must start with '/'");
  }

  process();
}

JSONPointer::JSONPointer(std::initializer_list<StringPiece> tokens) {
  for (const auto& token : tokens) {
    pushToken(token);
  }
}

bool JSONPointer::operator==(const JSONPointer& other) const noexcept {
  if (tokens_.size() != other.tokens_.size()) {
    return false;
  }
  for (auto i1 = tokens_.begin(), i2 = other.tokens_.begin(), e = tokens_.end();
       i1 != e;
       ++i1, ++i2) {
    if (*i1 != *i2) {
      return false;
    }
  }
  return true;
}

bool JSONPointer::operator!=(const JSONPointer& other) const noexcept {
  return !(*this == other);
}

const std::vector<std::string>& JSONPointer::tokens() const {
  return tokens_;
}

std::string JSONPointer::toString() const {
  if (tokens_.empty()) {
    return "";
  }
  std::string res;
  for (const auto& token : tokens_) {
    res.push_back('/');
    res.reserve(res.size() + token.size());

    static const std::regex escapeCharRE("[~/]");
    // Escape '~' as '~0', '/' as '~1'
    std::regex_replace(
        std::back_inserter(res),
        token.begin(),
        token.end(),
        escapeCharRE,
        "~$&",
        std::regex_constants::format_sed);
  }
  return res;
}

namespace {

// Revert a single escape sequence.
// Throws if the esc parameter is not a valid escape sequence.
//
// * '~0' reverses to '~'
// * '~1' reverses to '/'
StringPiece::iterator replaceEscape(
    StringPiece::iterator beg,
    StringPiece::iterator end) {
  static const std::unordered_map<char, char> mapper{{'0', '~'}, {'1', '/'}};
  if (beg < end && *beg == '~') {
    beg++; // move from '~' to possible next char.
    if (beg < end) {
      auto map_it = mapper.find(*beg);
      if (map_it != mapper.end()) {
        *(beg - 1) = map_it->second;
        return beg;
      }
    }
    beg--;
    throw JSONPointerException(
        to<std::string>("'", *beg, "' not a valid escape sequence"));
  }
  return beg; // nothing to replace
}

} // namespace

void JSONPointer::pushToken(StringPiece token) {
  std::string t;
  t.reserve(token.size());

  // replace escapes
  for (auto it = token.begin(); it != token.end();) {
    auto next = std::find(it, token.end(), '~');
    t.append(it, next);
    it = next;
    if (it != token.end()) {
      it = replaceEscape(it, token.end());
      t.push_back(*(it - 1));
    }
  }

  tokens_.push_back(std::move(t));
}

} // namespace folly
EOL

echo "✅ Created fixed json_pointer.cpp file in ios directory"

echo "🎉 Fix script completed successfully. The patch files will be used during the build process." 