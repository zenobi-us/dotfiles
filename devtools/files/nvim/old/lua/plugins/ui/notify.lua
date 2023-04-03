  -- Better `vim.notify()`
  return {
    "rcarriga/nvim-notify",
    init = function()
      -- when noice is not enabled, install notify on VeryLazy
      local Util = require("lazyvim.util")
      if not Util.has("noice.nvim") then
        Util.on_very_lazy(function()
          vim.notify = require("notify")
        end)
      end
    end,

    config = function (opts)
        require('notify').setup({
            timeout = 3000,
            max_height = function()
                return math.floor(vim.o.lines * 0.75)
            end,

            max_width = function()
                return math.floor(vim.o.columns * 0.75)
            end,
        });

        require('legendary').commands({
            {
                ":Telescope notify",
                description = "Notifications: History"
            }
        })

        require('legendary').keymaps({
           {
               '<leader>no',
               {
                   n = ':Telescope notify'
               }
           },
           {
                "<leader>un",
                {
                    n = function()
                        require("notify").dismiss({ silent = true, pending = true })
                    end
                },
                description = "Notifications: Delete all Notifications"
            }
        })
    end
  }
