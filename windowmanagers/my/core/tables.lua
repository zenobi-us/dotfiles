-- merge-table
--
-- https://gist.github.com/qizhihere/cb2a14432d9bf65693ad?permalink_comment_id=3389084#gistcomment-3389084
--

local function table_clone_internal(t, copies)
    if type(t) ~= "table" then return t end
    
    copies = copies or {}
    if copies[t] then return copies[t] end
  
    local copy = {}
    copies[t] = copy
  
    for k, v in pairs(t) do
      copy[table_clone_internal(k, copies)] = table_clone_internal(v, copies)
    end
  
    setmetatable(copy, table_clone_internal(getmetatable(t), copies))
  
    return copy
  end
  
  local function table_clone(t)
    -- We need to implement this with a helper function to make sure that
    -- user won't call this function with a second parameter as it can cause
    -- unexpected troubles
    return table_clone_internal(t)
  end
  
  local function table_merge(...)
    local tables_to_merge = {...}
    assert(#tables_to_merge > 1, "There should be at least two tables to merge them")
  
    for k, t in ipairs(tables_to_merge) do
      assert(type(t) == "table", string.format("Expected a table as function parameter %d", k))
    end
  
    local result = table_clone(tables_to_merge[1])
  
    for i = 2, #tables_to_merge do
      local from = tables_to_merge[i]
      for k, v in pairs(from) do
        if type(v) == "table" then
          result[k] = result[k] or {}
          assert(type(result[k]) == "table", string.format("Expected a table: '%s'", k))
          result[k] = table_merge(result[k], v)
        else
        result[k] = v
        end
      end
    end
  
    return result
  end

  local function values(table)
    local values = {}
    for _, value in ipairs(table) do
      table.insert(values, value)
    end
  
    return values
  end
  
  return {
    values = values,
    clone = table_clone,
    merge = table_merge,
  }