const apiData = require('./apiData');
const VariationSearchMap = require('./VariationSearchMap');

const variationSearchMap = new VariationSearchMap(apiData);

const searchCriteria = [
    { name: '颜色', value: '红色' },
    { name: '尺码', value: '40' },
    { name: '性别', value: '女' }
];
const matchedProduct = variationSearchMap.findProductByVariationMappings(searchCriteria);

console.log(JSON.stringify(variationSearchMap.tree));
console.log('matchedProduct', matchedProduct);