# Overview

**Module Name** : BeOp Bidder Adapter  
**Module Type** : Bidder Adapter  
**Maintainer** : tech@beop.io

# Description

Module that connects to BeOp's demand sources

# Test Parameters
```
    var adUnits = [
        {
            code: 'in-article',
            mediaTypes: {
                banner: {
                    sizes: [[300, 250]],  // a display size
                }
            },
            bids: [
                {
                    bidder: "example",
                    params: {
                        placement: '12345'
                    }
                }
            ]
        },{
            code: 'bellow-article',
            mediaTypes: {
                banner: {
                    sizes: [[320, 50]],   // a mobile size
                }
            },
            bids: [
                {
                    bidder: "example",
                    params: {
                        placement: 67890
                    }
                }
            ]
        }
    ];
```

