#pragma strict

var isBackButton: boolean;

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
	if(isBackButton == true)
	{
	//Loading back to main menu
	Application.LoadLevel("MainMenu");
	}

else
{	//Volume mute coding
	if(GetComponent(TextMesh).text == "ON")
	{
	GetComponent(TextMesh).text = "OFF";
	 AudioListener.pause = true;
	}
	else
	{
		GetComponent(TextMesh).text = "ON";
		 AudioListener.pause = false;
	}
}
}