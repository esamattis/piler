
# Remove last comma from string
removeTrailingComma = (s) ->
  s.trim().replace(/,$/, "")

# Map of functions that can convert various Javascript objects to strings.
types =

  function: (fn) -> "#{ fn }"
  string: (s) -> JSON.stringify s # Knows how to correctly serialize strings to String literals
  number: (n) -> n.toString()
  boolean: (n) -> n.toString()

  object: (obj) ->

    # typeof reports array as object
    return this._array obj if Array.isArray obj

    code = "{"
    code +=  "\"#{ k }\": #{ codeFrom v }," for k, v of obj
    removeTrailingComma(code) + "}"

  _array: (array) ->
    code = "["
    code += " #{ codeFrom v },"  for v in array
    removeTrailingComma(code) + "]"


# Generates code string from given object. Works for numbers, strings, regexes
# and even functions. Does not handle circular references.
exports.stringify = codeFrom = (obj) ->
  types[typeof obj]?(obj)


if require.main is module
  console.log exports.stringify
    foo: 1
    bar: 
      lol: ":D"
      hah: 2
