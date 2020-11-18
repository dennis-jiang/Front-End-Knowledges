const apiData = {
    variations: [
        {
            name: '颜色',
            values: [
                { name: '白色' },
                { name: '红色' },
            ]
        },
        {
            name: '尺码',
            values: [
                { name: '39' },
                { name: '40' },
            ]
        },
        {
            name: '性别',
            values: [
                { name: '男' },
                { name: '女' },
            ]
        },
    ],
    products: [
        {
            id: 1,
            variationMappings: [
                { name: '颜色', value: '白色' },
                { name: '尺码', value: '39' },
                { name: '性别', value: '男' }
            ]
        },
        {
            id: 2,
            variationMappings: [
                { name: '颜色', value: '白色' },
                { name: '尺码', value: '39' },
                { name: '性别', value: '女' }
            ]
        },
        {
            id: 3,
            variationMappings: [
                { name: '颜色', value: '白色' },
                { name: '尺码', value: '40' },
                { name: '性别', value: '男' }
            ]
        },
        {
            id: 4,
            variationMappings: [
                { name: '颜色', value: '白色' },
                { name: '尺码', value: '40' },
                { name: '性别', value: '女' }
            ]
        },
        {
            id: 5,
            variationMappings: [
                { name: '颜色', value: '红色' },
                { name: '尺码', value: '39' },
                { name: '性别', value: '男' }
            ]
        },
        {
            id: 6,
            variationMappings: [
                { name: '颜色', value: '红色' },
                { name: '尺码', value: '39' },
                { name: '性别', value: '女' }
            ]
        },
        {
            id: 7,
            variationMappings: [
                { name: '颜色', value: '红色' },
                { name: '尺码', value: '40' },
                { name: '性别', value: '男' }
            ]
        },
        {
            id: 8,
            variationMappings: [
                { name: '颜色', value: '红色' },
                { name: '尺码', value: '40' },
                { name: '性别', value: '女' }
            ]
        },
    ]
};

module.exports = apiData;