class VariationSearchMap {
    constructor(apiData) {
        this.tree = this.buildTree(apiData);
    }

    buildTree(apiData) {
        const tree = {};
        const { variations, products } = apiData;

        // 先用variations将树形结构构建出来，叶子节点默认值为null
        addNode(tree, 0);
        function addNode(root, deep) {
            const variationName = variations[deep].name;
            const variationValues = variations[deep].values;

            for (let i = 0; i < variationValues.length; i++) {
                const nodeName = `${variationName}：${variationValues[i].name}`;
                if (deep === variations.length - 1) {
                    root[nodeName] = null;
                } else {
                    root[nodeName] = {};
                    addNode(root[nodeName], deep + 1);
                }
            }
        }

        // 然后遍历一次products给树的叶子节点填上值
        for (let i = 0; i < products.length; i++) {
            const product = products[i];
            const { variationMappings } = product;
            const level1Name = `${variationMappings[0].name}：${variationMappings[0].value}`;
            const level2Name = `${variationMappings[1].name}：${variationMappings[1].value}`;
            const level3Name = `${variationMappings[2].name}：${variationMappings[2].value}`;
            tree[level1Name][level2Name][level3Name] = product;
        }

        // 最后返回构建好的树
        return tree;
    }

    // 添加一个方法来搜索商品，参数结构和API数据的variationMappings一样
    findProductByVariationMappings(variationMappings) {
        const level1Name = `${variationMappings[0].name}：${variationMappings[0].value}`;
        const level2Name = `${variationMappings[1].name}：${variationMappings[1].value}`;
        const level3Name = `${variationMappings[2].name}：${variationMappings[2].value}`;

        const product = this.tree[level1Name][level2Name][level3Name];

        return product;
    }
}

module.exports = VariationSearchMap;