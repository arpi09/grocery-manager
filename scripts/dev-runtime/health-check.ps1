param(
	[int]$Port = 5173,
	[string]$Path = '/login'
)

$url = "http://localhost:${Port}${Path}"

try {
	$response = Invoke-WebRequest -Uri $url -UseBasicParsing -MaximumRedirection 0 -TimeoutSec 8
	Write-Host "OK $url -> $($response.StatusCode)"
	exit 0
} catch {
	$status = $_.Exception.Response.StatusCode.value__
	if ($status -eq 302) {
		Write-Host "OK $url -> 302 (redirect, server up)"
		exit 0
	}

	Write-Host "DOWN $url -> $status $($_.Exception.Message)"
	exit 1
}
