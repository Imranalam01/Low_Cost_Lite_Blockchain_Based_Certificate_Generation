// core_cpp/c_interface.cpp
#include "merkle.h"
#include "sha256.h"
#include <cstring>
#include <vector>

extern "C" {
    void compute_sha256(const char* input, char* output_buf) {
        if (!input || !output_buf) return;
        std::string res = sha256(std::string(input));
        std::strcpy(output_buf, res.c_str());
    }

    void compute_merkle_root(const char** hashes, int count, char* output_buf) {
        if (!output_buf) return;
        if (!hashes || count <= 0) {
            output_buf[0] = '\0'; // Safe null-termination
            return;
        }
        std::vector<std::string> leaf_hashes;
        leaf_hashes.reserve(count);
        for (int i = 0; i < count; ++i) {
            if (hashes[i]) {
                leaf_hashes.push_back(std::string(hashes[i]));
            }
        }
        if (leaf_hashes.empty()) {
            output_buf[0] = '\0';
            return;
        }
        MerkleTree tree(leaf_hashes);
        std::string root = tree.getRoot();
        std::strcpy(output_buf, root.c_str());
    }
}