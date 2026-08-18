#include "merkle.h"
#include "sha256.h"
#include <stdexcept>

MerkleTree::MerkleTree(const std::vector<std::string>& leaf_hashes) {
    if (leaf_hashes.empty()) {
        throw std::invalid_argument("Leaf hashes cannot be empty");
    }
    tree.push_back(leaf_hashes);
    buildTree();
}

void MerkleTree::buildTree() {
    while (tree.back().size() > 1) {
        const auto& current_level = tree.back();
        std::vector<std::string> next_level;

        for (size_t i = 0; i < current_level.size(); i += 2) {
            std::string left = current_level[i];
            // Duplicate odd node if vector length is odd
            std::string right = (i + 1 < current_level.size()) ? current_level[i + 1] : left;
            next_level.push_back(sha256(left + right));
        }
        tree.push_back(next_level);
    }
}

std::string MerkleTree::getRoot() const {
    return tree.empty() ? "" : tree.back()[0];
}