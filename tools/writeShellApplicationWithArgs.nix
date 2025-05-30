{ pkgs }:
{
  name,
  runtimeInputs ? [ ],
  arguments,
  text,
}:
pkgs.writeShellApplication {
  inherit name;
  runtimeInputs = [ pkgs.argc ] ++ runtimeInputs;
  # TODO: More strongly type `arguments`
  text = ''
    ${builtins.concatStringsSep "\n" (
      map (
        arg:
        "# @${arg.type or "option"}  ${if arg.type or "option" == "option" then "--" else ""}${arg.arg}${
          if builtins.hasAttr "required" arg && builtins.hasAttr "multi" arg then
            "+"
          else if builtins.hasAttr "required" arg then
            "!"
          else if builtins.hasAttr "multi" arg then
            "*"
          else if builtins.hasAttr "rawOpts" arg then
            "${arg.rawOpts}"
          else
            ""
        } ${arg.help or ""}"
      ) arguments
    )}
    ${builtins.concatStringsSep "\n" (map (arg: "argc_${arg.arg}=${arg.default or "0"}") arguments)}

    eval "$(argc --argc-eval "$0" "$@")"

    ${text}
  '';
}
