#ifndef MERKLE_H
#define MERKLE_H

#include <string>
#include <vector>

class MerkleTree {
public:
    explicit MerkleTree(const std::vector<std::string>& leaf_hashes);
    std::string getRoot() const;

private:
    std::vector<std::vector<std::string>> tree;
    void buildTree();
};

#endif