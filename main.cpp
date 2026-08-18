// core_cpp/main.cpp
#include <iostream>
#include <fstream>
#include <vector>
#include <string>
#include "json.hpp"
#include "merkle.h"

using json = nlohmann::json;

int main(int argc, char* argv[]) {
    std::string input_path = (argc > 1) ? argv[1] : "batch_payload.json";
    
    std::ifstream file(input_path);
    if (!file.is_open()) {
        std::cerr << "Error: Unable to open input file: " << input_path << std::endl;
        return 1;
    }

    json input_json;
    try {
        file >> input_json;
    } catch (const std::exception& e) {
        std::cerr << "Error: JSON parse error in " << input_path << ": " << e.what() << std::endl;
        return 1;
    }

    if (!input_json.contains("records") || !input_json["records"].is_array() || input_json["records"].empty()) {
        std::cerr << "Error: 'records' field is missing or not a non-empty array." << std::endl;
        return 1;
    }

    std::vector<std::string> raw_hashes;
    for (const auto& record : input_json["records"]) {
        if (record.contains("raw_hash") && record["raw_hash"].is_string()) {
            raw_hashes.push_back(record["raw_hash"].get<std::string>());
        }
    }

    if (raw_hashes.empty()) {
        std::cerr << "Error: No valid 'raw_hash' strings found in payload." << std::endl;
        return 1;
    }

    try {
        MerkleTree merkle(raw_hashes);
        json output_json;
        output_json["batch_id"] = input_json.value("batch_id", "UNKNOWN_BATCH");
        output_json["merkle_root"] = "0x" + merkle.getRoot();
        output_json["total_records"] = raw_hashes.size();

        std::cout << output_json.dump(4) << std::endl;
    } catch (const std::exception& e) {
        std::cerr << "Error computing Merkle Tree: " << e.what() << std::endl;
        return 1;
    }

    return 0;
}