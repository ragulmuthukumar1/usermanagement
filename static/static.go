package static

import (
	"embed"
)

//go:embed static/* *.html *.png *.json
var FS embed.FS
