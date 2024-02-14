{ pkgs, ... }:
{
  services.postgres = {
    enable = true;
    package = pkgs.postgresql_15;
    initialDatabases = [{ name = "jinx"; }];
    port = 5432;
    listen_addresses = "127.0.0.1";
  };
}
