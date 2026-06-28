{
  pkgs,
  lib,
  config,
  ...
}:
{
  # https://devenv.sh/languages/
  languages = {
    javascript = {
      enable = true;
      pnpm = {
        enable = true;
        install.enable = true;
      };
    };
  };

  # https://devenv.sh/services/
  services = {
    postgres = {
      enable = true;
      # You can override the package if needed:
      # package = pkgs.postgresql;
    };
  };

  # Optional: Add utility packages
  packages = [
    pkgs.nodejs_22 # Or latest supported version
		pkgs.typescript-language-server # TypeScript Language Server
  ];

  # See full reference at https://devenv.sh/reference/options/
}
