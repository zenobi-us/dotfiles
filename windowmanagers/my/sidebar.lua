local radical = require('radical')



local function create()
    local box = radical.box {}
    box:add_item { }
    return box
end

return {
    create = create
}
