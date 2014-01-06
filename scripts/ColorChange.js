#pragma strict

var isQuitButton : boolean;
var isOptionsButton : boolean;
var isStartButton : boolean;

function OnMouseEnter()
{
//changing color of text maouse on it
renderer.material.color = Color.green; 
}

function OnMouseExit()
{
//changing color of text maouse on it
renderer.material.color = Color.white; 
}

function OnMouseUp()
{
	if(isQuitButton == true)
	{
	//We perform exit operation here
		Application.Quit();
	}
	if(isOptionsButton == true)
	{
	 // we go to options sceene here
	 Application.LoadLevel("Options");
	}
	if(isStartButton == true)
	{
		//Starting game here
		Application.LoadLevel("Sahne1");
	}

}