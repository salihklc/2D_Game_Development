#pragma strict

	var dayi : GameObject;

	function Update () 
	{
		//is there a touch a screen
		if (Input.touches.Length <= 0) 
		{
			//nor touch
		} 
		else 
		{
			
			for(var i : int =0;i<Input.touchCount;i++)
			{
				//number of touch i
				if(this.guiTexture.HitTest(Input.GetTouch(i).position))
				{
					//if current touch hit our gui then run this
					if(Input.GetTouch(i).phase==TouchPhase.Began)
					{
						dayi.transform.Translate(-0.2,0,0);
						

					}
					if(Input.GetTouch(i).phase==TouchPhase.Ended)
					{

					}
				}
				
			}
			
		}
	}
