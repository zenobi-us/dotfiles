
function switch(element)
  local Table = {
    ["Value"] = element,
    ["DefaultFunction"] = nil,
    ["Functions"] = {}
  }

  Table.case = function(testElement, callback)
    Table.Functions[testElement] = callback
    return Table
  end

  Table.default = function(callback)
    Table.DefaultFunction = callback
    return Table
  end

  Table.process = function()
    local Case = Table.Functions[Table.Value]
    if Case then
      Case()
    elseif Table.DefaultFunction then
      Table.DefaultFunction()
    end
  end

  return Table
end

return switch
